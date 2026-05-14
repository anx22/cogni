// =============================================================================
//  inspect-pipeline
// -----------------------------------------------------------------------------
//  End-to-End-Trace eines Assets / Runs / Projekts durch die Pipeline.
//  Aufruf nur mit gültigem User-JWT. Datenrückgabe wird auf user_id gefiltert.
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, fail, ok, requireUser } from "../_shared/inspect-auth.ts";
import { withErrorBoundary } from "../_shared/withErrorBoundary.ts";
import { createLogger } from "../_shared/logger.ts";

interface Body {
  asset_id?: string;
  run_id?: string;
  project_id?: string;
  /** Liefert alle pipeline_events für eine Korrelations-Kette zurück. */
  correlation_id?: string;
  /** Liefert die letzten N Korrelationen (gruppiert) — default: 25 */
  recent?: number;
  /** Filter für recent-Mode: nur Events ab diesem Level (info|warn|error). */
  min_level?: "info" | "warn" | "error";
}

interface PipelineEvent {
  id: string;
  ts: string;
  fn: string;
  stage: string;
  level: string;
  correlation_id: string | null;
  asset_id: string | null;
  run_id: string | null;
  session_id: string | null;
  project_id: string | null;
  duration_ms: number | null;
  message: string | null;
  payload: Record<string, unknown> | null;
  error: Record<string, unknown> | null;
}

Deno.serve(withErrorBoundary("inspect-pipeline", async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail(405, "POST only");

  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const userId = auth.userId;

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(url, serviceKey);

  let body: Body;
  try { body = await req.json() as Body; } catch { return fail(400, "invalid JSON"); }

  const trace: Record<string, unknown> = { user_id: userId };

  try {
    if (body.asset_id) {
      const [{ data: asset }, { data: parsed }, { data: runs }] = await Promise.all([
        sb.from("assets").select("*").eq("id", body.asset_id).eq("user_id", userId).maybeSingle(),
        sb.from("parsed_documents").select("*").eq("asset_id", body.asset_id).eq("user_id", userId).order("created_at", { ascending: false }),
        sb.from("aol_runs").select("*").eq("asset_id", body.asset_id).eq("user_id", userId).order("created_at", { ascending: false }),
      ]);
      trace.asset = asset;
      trace.parsed_documents = parsed;
      trace.aol_runs = runs;

      const parsedIds = (parsed ?? []).map((p: { id: string }) => p.id);
      let proposed: { id: string; status: string; fact_type: string; delta_type: string | null; confidence: number | null; created_at: string }[] = [];
      if (parsedIds.length) {
        const { data } = await sb.from("proposed_facts")
          .select("id, status, fact_type, delta_type, confidence, created_at, graphiti_episode_uuid")
          .in("parsed_document_id", parsedIds)
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        proposed = data ?? [];
      }
      trace.proposed_facts = proposed;

      if (proposed.length) {
        const proposedIds = proposed.map((p) => p.id);
        const [{ data: cases }, { data: facts }] = await Promise.all([
          sb.from("review_cases").select("*").in("proposed_fact_id", proposedIds).eq("user_id", userId),
          sb.from("canonical_facts")
            .select("id, fact_type, source_proposed_fact_id, valid_from, valid_until, superseded_by, graphiti_uuid")
            .in("source_proposed_fact_id", proposedIds).eq("user_id", userId),
        ]);
        trace.review_cases = cases;
        trace.canonical_facts = facts;
      }
    }

    if (body.run_id) {
      const { data: run } = await sb.from("aol_runs").select("*").eq("id", body.run_id).eq("user_id", userId).maybeSingle();
      trace.aol_run = run;
    }

    if (body.project_id) {
      const [{ data: snapshot }, { data: events }, { data: facts }] = await Promise.all([
        sb.from("project_state_snapshots").select("*").eq("project_id", body.project_id).eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        sb.from("change_events").select("*").eq("project_id", body.project_id).eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
        sb.from("canonical_facts").select("id, fact_type, graphiti_uuid, valid_from, valid_until, superseded_by").eq("project_id", body.project_id).eq("user_id", userId).limit(200),
      ]);
      trace.project_state_snapshot = snapshot;
      trace.change_events = events;
      trace.canonical_facts_sample = (facts ?? []).slice(0, 50);
      trace.graphiti_coverage = facts ? {
        total: facts.length,
        with_uuid: facts.filter((f: { graphiti_uuid: string | null }) => f.graphiti_uuid).length,
        active: facts.filter((f: { valid_until: string | null; superseded_by: string | null }) => !f.valid_until && !f.superseded_by).length,
      } : null;
    }

    // ----- pipeline_events: Stages für eine Korrelations-Kette ---------------
    if (body.correlation_id) {
      const { data: events } = await sb
        .from("pipeline_events")
        .select("*")
        .eq("user_id", userId)
        .eq("correlation_id", body.correlation_id)
        .order("ts", { ascending: true });
      trace.pipeline_events = (events ?? []) as PipelineEvent[];
      trace.pipeline_summary = summarizeEvents((events ?? []) as PipelineEvent[]);
    }

    // ----- pipeline_events: letzte N Korrelationen (für Health-Übersicht) ----
    if (body.recent && !body.correlation_id) {
      const limit = Math.min(Math.max(body.recent, 1), 200);
      // Wir holen 10x mehr Rohzeilen als Korrelationen — Stages je Korrelation
      // sind im Schnitt 5–15. Dann gruppieren wir lokal nach correlation_id.
      const { data: rawEvents } = await sb
        .from("pipeline_events")
        .select("*")
        .eq("user_id", userId)
        .order("ts", { ascending: false })
        .limit(limit * 20);
      const events = (rawEvents ?? []) as PipelineEvent[];
      const groups = new Map<string, PipelineEvent[]>();
      for (const ev of events) {
        const key = ev.correlation_id ?? `none:${ev.id}`;
        const arr = groups.get(key) ?? [];
        arr.push(ev);
        groups.set(key, arr);
      }
      const correlations = Array.from(groups.entries())
        .map(([cid, evs]) => {
          const ordered = [...evs].sort((a, b) => a.ts.localeCompare(b.ts));
          return {
            correlation_id: cid,
            ...summarizeEvents(ordered),
          };
        })
        .sort((a, b) => (b.last_ts ?? "").localeCompare(a.last_ts ?? ""))
        .filter((c) => {
          if (!body.min_level) return true;
          const order = { info: 0, warn: 1, error: 2 } as const;
          return order[c.worst_level as keyof typeof order] >= order[body.min_level];
        })
        .slice(0, limit);
      trace.recent_correlations = correlations;
    }

    if (
      !body.asset_id &&
      !body.run_id &&
      !body.project_id &&
      !body.correlation_id &&
      !body.recent
    ) {
      return fail(400, "asset_id, run_id, project_id, correlation_id or recent required");
    }

    return ok({ trace });
  } catch (e) {
    return fail(500, "pipeline trace failed", { detail: String((e as Error).message ?? e) });
  }
}));

// Verdichtet eine Stage-Kette zu einer kompakten Zusammenfassung. Wichtig für
// die Health-Übersicht: pro Korrelation eine Karte, ohne 20 Roh-Events laden zu
// müssen.
function summarizeEvents(events: PipelineEvent[]) {
  if (events.length === 0) {
    return { count: 0, fns: [], stages: [], worst_level: "info", last_ts: null, total_ms: 0, error_count: 0 };
  }
  const fns = Array.from(new Set(events.map((e) => e.fn)));
  const stages = events.map((e) => `${e.fn}:${e.stage}`);
  const worst = events.some((e) => e.level === "error")
    ? "error"
    : events.some((e) => e.level === "warn")
      ? "warn"
      : "info";
  const first = events[0];
  const last = events[events.length - 1];
  const totalMs = (last.duration_ms ?? 0) - (first.duration_ms ?? 0);
  const errs = events
    .filter((e) => e.level === "error")
    .map((e) => ({ fn: e.fn, stage: e.stage, message: e.message, error: e.error }));
  return {
    count: events.length,
    fns,
    stages,
    worst_level: worst,
    error_count: errs.length,
    errors: errs,
    last_ts: last.ts,
    first_ts: first.ts,
    total_ms: Math.max(0, totalMs),
    asset_id: events.find((e) => e.asset_id)?.asset_id ?? null,
    run_id: events.find((e) => e.run_id)?.run_id ?? null,
    project_id: events.find((e) => e.project_id)?.project_id ?? null,
    session_id: events.find((e) => e.session_id)?.session_id ?? null,
  };
}
