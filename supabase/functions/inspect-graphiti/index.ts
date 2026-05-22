/* eslint-disable @typescript-eslint/no-explicit-any */
// =============================================================================
//  inspect-graphiti — Action-Dispatch via _shared/inspector.ts.
//  Liest Health + Such-Snapshot eines Project-Graphen über den deployten
//  graphiti-server (REST). group_id == project_id.
//  diagnose: aggregiert `graphiti_sync_log` (status + failed-Reasons gruppiert),
//  ohne Roundtrip in den Graphiti-Server — rein DB-seitig.
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { fail } from "../_shared/inspect-auth.ts";
import { inspector } from "../_shared/inspector.ts";
import { groupFailedReasons, normalizeReason } from "./diagnose.ts";

// URL-Härtung analog _shared/graphiti.ts: fehlendes Schema → https:// ergänzen.
function normalizeBase(raw: string): string {
  const t = raw.trim().replace(/\/+$/, "");
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}
const BASE = normalizeBase(Deno.env.get("GRAPHITI_SERVICE_URL") ?? "");
const TOKEN = Deno.env.get("GRAPHITI_SERVICE_TOKEN") ?? "";

async function gFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      ...(init.headers ?? {}),
    },
  });
}

Deno.serve(
  inspector(
    "inspect-graphiti",
    {
      health: async () => {
        if (!BASE) return fail(500, "GRAPHITI_SERVICE_URL not configured");
        const r = await gFetch("/healthcheck", { method: "GET" });
        const txt = await r.text();
        return { status: r.status, body: txt.slice(0, 400) };
      },

      search: async ({ body }) => {
        if (!BASE) return fail(500, "GRAPHITI_SERVICE_URL not configured");
        const projectId = body.project_id as string | undefined;
        if (!projectId) return fail(400, "project_id required");
        const r = await gFetch("/search", {
          method: "POST",
          body: JSON.stringify({
            group_ids: [projectId],
            query: (body.query as string | undefined) ?? "",
            max_facts: (body.limit as number | undefined) ?? 20,
          }),
        });
        const txt = await r.text();
        if (!r.ok) {
          return fail(502, "graphiti search error", { status: r.status, body: txt.slice(0, 600) });
        }
        return JSON.parse(txt);
      },

      episodes: async ({ body }) => {
        if (!BASE) return fail(500, "GRAPHITI_SERVICE_URL not configured");
        const projectId = body.project_id as string | undefined;
        if (!projectId) return fail(400, "project_id required");
        const limit = (body.limit as number | undefined) ?? 20;
        const r = await gFetch(`/episodes/${encodeURIComponent(projectId)}?last_n=${limit}`, {
          method: "GET",
        });
        const txt = await r.text();
        if (!r.ok) {
          return fail(502, "graphiti episodes error", {
            status: r.status,
            body: txt.slice(0, 600),
          });
        }
        return { episodes: JSON.parse(txt) };
      },

      // ---------------------- diagnose ----------------------
      // Aggregiert sync_log:
      //   - totals: counts pro status (ok/failed/pending/missing/…)
      //   - failed_reasons: gruppiert nach normalisierter error-Message, sortiert
      //     nach count desc, mit sample entity_id + letztem Vorkommen
      //   - recent_failures: die letzten 20 failed-Rows, roh
      // Optional: project_id (über payload.project_id gefiltert), since (ISO).
      diagnose: async ({ body, userId, log }) => {
        const url = Deno.env.get("SUPABASE_URL");
        const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!url || !service) return fail(500, "supabase env missing");
        // deno-lint-ignore no-explicit-any
        const sb: any = createClient(url, service);

        const projectId = body.project_id as string | undefined;
        const since = body.since as string | undefined;
        const limit = (body.limit as number | undefined) ?? 20;

        let query = sb
          .from("graphiti_sync_log")
          .select(
            "id, entity_type, entity_id, operation, status, attempt, error, payload, created_at, updated_at",
          )
          .eq("user_id", userId);
        if (since) query = query.gte("created_at", since);
        const { data: rows, error } = await query;
        if (error) {
          log.warn("diagnose.read_failed", "graphiti_sync_log read failed", {
            error: error.message,
          });
          return fail(500, "could not read graphiti_sync_log", { detail: error.message });
        }
        const all = (rows ?? []) as Array<{
          id: string;
          entity_type: string;
          entity_id: string;
          operation: string;
          status: string;
          attempt: number;
          error: string | null;
          payload: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        }>;

        // project_id-Filter über payload.project_id (Best-Effort).
        const scoped = projectId
          ? all.filter((r) => {
              const p = r.payload as { project_id?: string } | null;
              return p?.project_id === projectId;
            })
          : all;

        const totals: Record<string, number> = {};
        for (const r of scoped) {
          totals[r.status] = (totals[r.status] ?? 0) + 1;
        }

        const failed = scoped.filter((r) => r.status === "failed");
        const failedReasons = groupFailedReasons(failed);

        const recent = [...failed]
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
          .slice(0, limit)
          .map((r) => ({
            id: r.id,
            entity_type: r.entity_type,
            entity_id: r.entity_id,
            operation: r.operation,
            attempt: r.attempt,
            reason: normalizeReason(r.error),
            error: r.error,
            created_at: r.created_at,
          }));

        log.stage("diagnose.aggregated", "sync_log aggregated", {
          total: scoped.length,
          failed: failed.length,
          reasons: failedReasons.length,
        });

        return {
          filters: { project_id: projectId ?? null, since: since ?? null },
          total_rows: scoped.length,
          totals,
          failed_reasons: failedReasons,
          recent_failures: recent,
        };
      },
    },
    { defaultAction: "health" },
  ),
);
