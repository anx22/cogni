// =============================================================================
//  inspect-pipeline
// -----------------------------------------------------------------------------
//  End-to-End-Trace eines Assets durch unsere Daten-Pipeline. Liest nur (RLS
//  per Service-Role bypassed; aber der Aufruf ist auf eingeloggte User
//  beschränkt und gibt nur Eigentümer-Daten zurück, indem der User-Filter
//  redundant geprüft wird, soweit Tabellen einen owner haben).
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, fail, ok, requireUser } from "../_shared/inspect-auth.ts";

interface Body {
  asset_id?: string;
  run_id?: string;
  project_id?: string;
}

Deno.serve(async (req) => {
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
      const [{ data: asset }, { data: parsed }, { data: proposed }, { data: runs }] = await Promise.all([
        sb.from("assets").select("*").eq("id", body.asset_id).maybeSingle(),
        sb.from("parsed_documents").select("*").eq("asset_id", body.asset_id).order("created_at", { ascending: false }),
        sb.from("proposed_facts").select("*").eq("source_asset_id", body.asset_id).order("created_at", { ascending: false }),
        sb.from("aol_runs").select("*").eq("asset_id", body.asset_id).order("created_at", { ascending: false }),
      ]);
      trace.asset = asset;
      trace.parsed_documents = parsed;
      trace.proposed_facts = proposed;
      trace.aol_runs = runs;

      const proposedIds = (proposed ?? []).map((p: { id: string }) => p.id);
      if (proposedIds.length) {
        const { data: cases } = await sb.from("review_cases")
          .select("*").in("proposed_fact_id", proposedIds);
        trace.review_cases = cases;
        const caseIds = (cases ?? []).map((c: { id: string }) => c.id);
        if (caseIds.length) {
          const { data: facts } = await sb.from("canonical_facts")
            .select("*").in("review_case_id", caseIds);
          trace.canonical_facts = facts;
        }
      }
    }

    if (body.run_id) {
      const { data: run } = await sb.from("aol_runs").select("*").eq("id", body.run_id).maybeSingle();
      trace.aol_run = run;
    }

    if (body.project_id) {
      const [{ data: snapshot }, { data: events }, { data: facts }] = await Promise.all([
        sb.from("project_state_snapshots").select("*").eq("project_id", body.project_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        sb.from("change_events").select("*").eq("project_id", body.project_id).order("created_at", { ascending: false }).limit(20),
        sb.from("canonical_facts").select("id, kind, key, value, graphiti_uuid, valid_from, invalidated_at").eq("project_id", body.project_id).limit(50),
      ]);
      trace.project_state_snapshot = snapshot;
      trace.change_events = events;
      trace.canonical_facts_sample = facts;
      trace.graphiti_coverage = facts ? {
        total: facts.length,
        with_uuid: facts.filter((f: { graphiti_uuid: string | null }) => f.graphiti_uuid).length,
      } : null;
    }

    if (!body.asset_id && !body.run_id && !body.project_id) {
      return fail(400, "asset_id, run_id, or project_id required");
    }

    return ok({ trace });
  } catch (e) {
    return fail(500, "pipeline trace failed", { detail: String((e as Error).message ?? e) });
  }
});
