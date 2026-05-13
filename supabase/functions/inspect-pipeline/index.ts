// =============================================================================
//  inspect-pipeline
// -----------------------------------------------------------------------------
//  End-to-End-Trace eines Assets / Runs / Projekts durch die Pipeline.
//  Aufruf nur mit gültigem User-JWT. Datenrückgabe wird auf user_id gefiltert.
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

    if (!body.asset_id && !body.run_id && !body.project_id) {
      return fail(400, "asset_id, run_id, or project_id required");
    }

    return ok({ trace });
  } catch (e) {
    return fail(500, "pipeline trace failed", { detail: String((e as Error).message ?? e) });
  }
});
