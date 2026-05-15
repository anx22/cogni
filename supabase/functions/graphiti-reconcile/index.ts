// =============================================================================
//  graphiti-reconcile
// -----------------------------------------------------------------------------
//  Auflösung der Episode-UUIDs nach asynchroner Spiegelung.
//
//  commit-fact spiegelt jeden canonical_fact via /messages an Graphiti.
//  Da /messages KEINE Episode-UUID zurückliefert, wird im Provenance-Block
//  nur `queued + source_description` festgehalten. Diese Funktion holt die
//  echte Episode-UUID per /episodes/{project_id}?last_n=N nach und schreibt:
//
//    - canonical_facts.graphiti_uuid
//    - graphiti_sync_log (status=ok|missing|failed)
//
//  Triggert sich selbst per Aufruf — kein Cron nötig (kann aber leicht ergänzt
//  werden). Die Funktion ist idempotent: bereits aufgelöste Fakten werden
//  übersprungen.
//
//  Body:  { project_id?: string, last_n?: number, max_facts?: number }
//  Auth:  Bearer (User-JWT) ODER Service-Role-Key im Authorization-Header.
//         Mit Service-Role: alle User. Mit User-JWT: nur eigene Daten.
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getEpisodes, isGraphitiConfigured } from "../_shared/graphiti.ts";
import { createLogger } from "../_shared/logger.ts";
import { withErrorBoundary } from "../_shared/withErrorBoundary.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  project_id?: string;
  last_n?: number;
  max_facts?: number;
}

Deno.serve(withErrorBoundary("graphiti-reconcile", async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);
  const log = createLogger({ fn: "graphiti-reconcile", client: admin });
  log.stage("start", "reconcile invoked");

  if (!isGraphitiConfigured()) {
    log.warn("config", "GRAPHITI_SERVICE_URL not set");
    await log.flush();
    return fail("GRAPHITI_SERVICE_URL nicht gesetzt", 503);
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Payload;
    const lastN = Math.min(Math.max(body.last_n ?? 200, 10), 500);
    const maxFacts = Math.min(Math.max(body.max_facts ?? 100, 1), 500);

    // Auth: erlaubt User-JWT ODER Service-Role-Key.
    const authHeader = req.headers.get("Authorization") ?? "";
    let userId: string | null = null;
    if (authHeader && !authHeader.includes(serviceKey)) {
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await userClient.auth.getUser();
      userId = data?.user?.id ?? null;
      if (!userId) {
        await log.flush();
        return fail("nicht angemeldet", 401);
      }
      log.bind({ userId });
    }
    log.stage("scan", "search pending facts", { lastN, maxFacts, project_id: body.project_id ?? null });

    // Offene Fakten finden (graphiti_uuid IS NULL, aber Mirror lief)
    let q = admin
      .from("canonical_facts")
      .select("id, project_id, fact_type, user_id, provenance")
      .is("graphiti_uuid", null)
      .order("created_at", { ascending: false })
      .limit(maxFacts);
    if (body.project_id) q = q.eq("project_id", body.project_id);
    if (userId) q = q.eq("user_id", userId);

    const { data: pending, error: pErr } = await q;
    if (pErr) throw new Error(`canonical_facts: ${pErr.message}`);

    // Stale-Cleanup: alte mirror/queued-Zeilen flippen, deren CF inzwischen
    // einen graphiti_uuid hat. Stale graphiti_error im provenance ebenfalls
    // entfernen. Nur einmal pro Reconcile-Lauf, idempotent.
    let staleFlipped = 0;
    let errorsCleared = 0;
    try {
      const { data: stale } = await admin
        .from("graphiti_sync_log")
        .select("id, entity_id")
        .eq("status", "queued")
        .in("operation", ["mirror", "backfill_mirror"])
        .limit(500);
      const staleIds = (stale ?? []).map((r) => r.id);
      const cfIds = Array.from(new Set((stale ?? []).map((r) => r.entity_id))).filter(Boolean) as string[];
      if (cfIds.length > 0) {
        const { data: confirmed } = await admin
          .from("canonical_facts")
          .select("id, provenance")
          .in("id", cfIds)
          .not("graphiti_uuid", "is", null);
        const confirmedIds = new Set((confirmed ?? []).map((c) => c.id));
        const flipIds = (stale ?? []).filter((r) => confirmedIds.has(r.entity_id)).map((r) => r.id);
        if (flipIds.length > 0) {
          await admin.from("graphiti_sync_log").update({ status: "ok" }).in("id", flipIds);
          staleFlipped = flipIds.length;
        }
        // Stale graphiti_error im provenance entfernen
        for (const cf of confirmed ?? []) {
          const prov = (cf.provenance ?? {}) as Record<string, unknown>;
          if (prov.graphiti_error) {
            const { graphiti_error: _drop, ...rest } = prov;
            await admin.from("canonical_facts").update({ provenance: rest }).eq("id", cf.id);
            errorsCleared++;
          }
        }
      }
      log.stage("stale_cleanup", "done", { staleFlipped, errorsCleared, scannedQueued: staleIds.length });
    } catch (e) {
      log.warn("stale_cleanup", "failed (non-fatal)", { error: e instanceof Error ? e.message : String(e) });
    }

    if (!pending || pending.length === 0) {
      log.stage("done", "nothing to reconcile");
      await log.flush();
      return ok({ scanned: 0, resolved: 0, missing: 0, failed: 0, staleFlipped, errorsCleared, projects: [], correlation_id: log.correlationId });
    }
    log.stage("pending", "found", { count: pending.length });

    // Pro Projekt EIN /episodes-Aufruf, dann lokal matchen.
    const byProject = new Map<string, typeof pending>();
    for (const cf of pending) {
      if (!cf.project_id) continue;
      const arr = byProject.get(cf.project_id) ?? [];
      arr.push(cf);
      byProject.set(cf.project_id, arr);
    }

    let resolved = 0;
    let missing = 0;
    let failed = 0;
    const perProject: Array<Record<string, unknown>> = [];

    for (const [projectId, facts] of byProject) {
      let episodes: Array<Record<string, unknown>> = [];
      try {
        const raw = await getEpisodes(projectId, lastN);
        episodes = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Pro Projekt-Fail: alle Fakten als 'failed' loggen
        for (const cf of facts) {
          await logSync(admin, cf, "failed", { error: msg });
          failed++;
        }
        perProject.push({ project_id: projectId, error: msg, facts: facts.length });
        continue;
      }

      // Index nach source_description aufbauen (eindeutig pro canonical_fact)
      const bySource = new Map<string, Record<string, unknown>>();
      for (const ep of episodes) {
        const sd = typeof ep.source_description === "string" ? ep.source_description : "";
        if (sd.startsWith("canonical_fact:")) bySource.set(sd, ep);
      }

      let projResolved = 0;
      let projMissing = 0;
      for (const cf of facts) {
        const key = `canonical_fact:${cf.id}`;
        const ep = bySource.get(key);
        if (!ep) {
          await logSync(admin, cf, "missing", { hint: "episode noch nicht im /episodes-Fenster" });
          projMissing++;
          missing++;
          continue;
        }
        const epUuid = typeof ep.uuid === "string" ? ep.uuid : null;
        if (!epUuid) {
          await logSync(admin, cf, "failed", { error: "episode ohne uuid" });
          failed++;
          continue;
        }

        // Provenance updaten (read-modify-write, Best-Effort)
        const prov = (cf.provenance ?? {}) as Record<string, unknown>;
        const graphProv = (prov.graphiti ?? {}) as Record<string, unknown>;
        const { error: uErr } = await admin
          .from("canonical_facts")
          .update({
            graphiti_uuid: epUuid,
            provenance: {
              ...prov,
              graphiti: {
                ...graphProv,
                resolved: true,
                resolved_at: new Date().toISOString(),
                episode_uuid: epUuid,
              },
            },
          })
          .eq("id", cf.id);
        if (uErr) {
          await logSync(admin, cf, "failed", { error: `cf-update: ${uErr.message}` });
          failed++;
          continue;
        }
        await logSync(admin, cf, "ok", {
          episode_uuid: epUuid,
          source_description: key,
          name: ep.name ?? null,
        });
        projResolved++;
        resolved++;
      }

      perProject.push({
        project_id: projectId,
        episodes_window: episodes.length,
        resolved: projResolved,
        missing: projMissing,
      });
    }

    log.stage("done", "reconcile complete", { scanned: pending.length, resolved, missing, failed });
    await log.flush();
    return ok({ scanned: pending.length, resolved, missing, failed, projects: perProject, correlation_id: log.correlationId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("error", msg, err);
    await log.flush();
    return fail(msg, 500);
  }
}));

async function logSync(
  admin: any,
  cf: { id: string; user_id: string; fact_type: string },
  status: "ok" | "missing" | "failed",
  payload: Record<string, unknown>,
) {
  await admin.from("graphiti_sync_log").insert({
    user_id: cf.user_id,
    entity_id: cf.id,
    entity_type: cf.fact_type ?? "canonical_fact",
    operation: "reconcile",
    status,
    payload,
    error: status === "failed" ? (payload.error as string | null) ?? null : null,
  });
}

// Lokale ok/fail mit `{ok: true|false, ...}` Envelope. // custom shape, intentional
function ok(payload: unknown) {
  return new Response(JSON.stringify({ ok: true, ...(payload as object) }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function fail(msg: string, status = 500) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
