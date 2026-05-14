// =============================================================================
//  graphiti-backfill
// -----------------------------------------------------------------------------
//  Re-Mirror aller canonical_facts, die noch keine erfolgreiche Graphiti-
//  Episode haben (graphiti_uuid IS NULL UND der letzte sync_log-Eintrag
//  ist `failed` ODER fehlt).
//
//  Hintergrund: Bis 2026-05-14 hat addMessage() die Pflicht-Property `role`
//  nicht gesetzt — Graphiti antwortete deshalb mit 422. Diese Funktion holt
//  die betroffenen Facts nach.
//
//  Body: { limit?: number, dry_run?: boolean }
//  Auth: Service-Role-Key oder eingeloggter User.
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  addMessage as graphitiAddMessage,
  GraphitiHttpError,
  GraphitiUnavailableError,
  isGraphitiConfigured,
} from "../_shared/graphiti.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  limit?: number;
  dry_run?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);
  const log = createLogger({ fn: "graphiti-backfill", client: admin });

  if (!isGraphitiConfigured()) {
    log.warn("config", "GRAPHITI_SERVICE_URL not set");
    await log.flush();
    return fail("GRAPHITI_SERVICE_URL nicht gesetzt", 503);
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Payload;
    const limit = Math.min(Math.max(body.limit ?? 100, 1), 500);
    const dryRun = !!body.dry_run;

    log.stage("scan", "fetch facts without graphiti_uuid", { limit, dryRun });

    const { data: facts, error } = await admin
      .from("canonical_facts")
      .select("id, project_id, fact_type, content, user_id, provenance")
      .is("graphiti_uuid", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    const candidates = facts ?? [];
    log.stage("scan", "candidates collected", { count: candidates.length });

    let mirrored = 0;
    let failed = 0;
    const errors: Array<{ id: string; message: string }> = [];

    for (const f of candidates) {
      const c = (f.content ?? {}) as Record<string, unknown>;
      const title = (c.title as string)?.toString().trim() || (f.fact_type as string);
      const rest = Object.entries(c)
        .filter(([k, v]) => k !== "title" && v != null && v !== "")
        .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
        .join(" · ");
      const episodeContent = rest ? `${title} — ${rest}` : title;

      if (dryRun) {
        log.stage("dry_run", "would mirror", { id: f.id, content: episodeContent.slice(0, 80) });
        continue;
      }

      try {
        await graphitiAddMessage({
          project_id: f.project_id,
          content: episodeContent,
          role_type: "user",
          name: `${f.fact_type}:${(f.id as string).slice(0, 8)}`,
          source_description: `canonical_fact:${f.id}`,
        });

        await admin.from("graphiti_sync_log").insert({
          user_id: f.user_id,
          entity_id: f.id,
          entity_type: f.fact_type ?? "canonical_fact",
          operation: "backfill_mirror",
          status: "queued",
          payload: {
            source_description: `canonical_fact:${f.id}`,
            project_id: f.project_id,
          },
        });

        const prov = (f.provenance ?? {}) as Record<string, unknown>;
        await admin
          .from("canonical_facts")
          .update({
            provenance: {
              ...prov,
              graphiti: {
                queued: true,
                queued_at: new Date().toISOString(),
                mode: "backfill_async",
                source_description: `canonical_fact:${f.id}`,
              },
              graphiti_error: null,
            },
          })
          .eq("id", f.id);

        mirrored++;
      } catch (err) {
        failed++;
        const errInfo =
          err instanceof GraphitiUnavailableError
            ? { kind: "unavailable", message: err.message }
            : err instanceof GraphitiHttpError
              ? { kind: "http", status: err.status, body: err.body.slice(0, 240) }
              : { kind: "unknown", message: err instanceof Error ? err.message : String(err) };
        const msg = (errInfo as { body?: string; message?: string }).body
          ?? (errInfo as { message?: string }).message
          ?? "unknown";
        errors.push({ id: f.id as string, message: msg });
        log.error("mirror", "backfill mirror failed", err, { id: f.id });
        await admin.from("graphiti_sync_log").insert({
          user_id: f.user_id,
          entity_id: f.id,
          entity_type: f.fact_type ?? "canonical_fact",
          operation: "backfill_mirror",
          status: "failed",
          error: msg,
          payload: errInfo,
        });
      }
    }

    log.stage("done", "backfill complete", { candidates: candidates.length, mirrored, failed });
    await log.flush();
    return ok({ candidates: candidates.length, mirrored, failed, errors: errors.slice(0, 10), dry_run: dryRun });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("error", "backfill fatal", err);
    await log.flush();
    return fail(msg, 500);
  }
});

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
