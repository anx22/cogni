// =============================================================================
//  test-data-sweep
// -----------------------------------------------------------------------------
//  Räumt alle Daten weg, die mit dem QA-Fixture-Marker versehen sind und älter
//  als ?max_age_hours (default 1h) sind.  Marker-Konvention:
//    table.metadata @> { "_origin": "qa-fixture" }
//
//  Aufruf:
//    POST /test-data-sweep            — räumt > 1h alte Fixtures
//    POST /test-data-sweep?dry_run=1  — listet nur, löscht nicht
//
//  Auth: nur mit Service-Role (Cron oder Admin-Skript).
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createLogger } from "../_shared/logger.ts";
import { withErrorBoundary } from "../_shared/withErrorBoundary.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Reihenfolge: Kinder vor Eltern.
const SWEEP_TABLES = [
  "change_events",
  "corrections",
  "review_cases",
  "canonical_facts",
  "proposed_facts",
  "dialog_sessions",
  "parsed_documents",
  "aol_runs",
  "assets",
  "projects",
  "pipeline_events",
] as const;

Deno.serve(withErrorBoundary("test-data-sweep", async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const maxAgeHours = Number(url.searchParams.get("max_age_hours") ?? "1");
  const dryRun = url.searchParams.get("dry_run") === "1";

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const log = createLogger({ fn: "test-data-sweep", client: admin });
  log.stage("start", "sweep started", { maxAgeHours, dryRun });

  const cutoff = new Date(Date.now() - maxAgeHours * 3600 * 1000).toISOString();
  const summary: Record<string, number> = {};

  try {
    for (const t of SWEEP_TABLES) {
      const q = admin
        .from(t)
        .select("id", { count: "exact", head: !dryRun })
        .filter("metadata->>_origin", "eq", "qa-fixture")
        .lt("created_at", cutoff);
      if (dryRun) {
        const { count, error } = await q;
        if (error) {
          log.stage("sweep.skip", `skip ${t}: ${error.message}`, { table: t });
          summary[t] = -1;
          continue;
        }
        summary[t] = count ?? 0;
      } else {
        const { error, count } = await admin
          .from(t)
          .delete({ count: "exact" })
          .filter("metadata->>_origin", "eq", "qa-fixture")
          .lt("created_at", cutoff);
        if (error) {
          log.stage("sweep.skip", `skip ${t}: ${error.message}`, { table: t });
          summary[t] = -1;
          continue;
        }
        summary[t] = count ?? 0;
      }
      log.stage("sweep.table", `swept ${t}`, { table: t, removed: summary[t] });
    }
    await log.flush();
    return new Response(
      JSON.stringify({ ok: true, dry_run: dryRun, cutoff, summary, correlation_id: log.correlationId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("sweep.error", msg);
    await log.flush();
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}));
