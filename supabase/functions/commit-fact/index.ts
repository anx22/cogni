// =============================================================================
//  commit-fact
// -----------------------------------------------------------------------------
//  Schritt 4 der Pipeline: ein vom Nutzer entschiedenes review_case wird
//  endgültig festgeschrieben — oder verworfen.
//
//  decision = 'confirm':
//    - canonical_facts eintragen (mit Provenance)
//    - change_event eintragen
//    - proposed_facts.status = 'committed'
//    - review_cases.box_state = 'bestaetigt'
//
//  decision = 'reject':
//    - proposed_facts.status = 'rejected'
//    - review_cases.box_state = 'verworfen'
//
//  Wenn alle Cases der Session abgeschlossen sind → dialog_session.status='completed'
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  review_case_id: string;
  decision: "confirm" | "reject";
  user_decision?: Record<string, unknown> | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  // Auth: wir validieren JWT manuell und stellen Owner-Check sicher.
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData } = await userClient.auth.getUser();
  const user = userData?.user;
  if (!user) return fail("nicht angemeldet", 401);

  try {
    const { review_case_id, decision, user_decision } = (await req.json()) as Payload;
    if (!review_case_id || !decision) throw new Error("review_case_id + decision erforderlich");

    // 1. review_case + proposed_fact laden -----------------------------------
    const { data: rc, error: rcErr } = await admin
      .from("review_cases")
      .select("*, proposed_fact:proposed_facts(*)")
      .eq("id", review_case_id)
      .single();
    if (rcErr || !rc) throw new Error(`review_case nicht gefunden: ${rcErr?.message}`);
    if (rc.user_id !== user.id) return fail("kein Zugriff", 403);

    const pf = rc.proposed_fact as
      | {
          id: string;
          fact_type: string;
          content: Record<string, unknown>;
          delta_type: string | null;
          against_fact_id: string | null;
          source_id: string | null;
          parsed_document_id: string | null;
          confidence: number | null;
          extraction_run_id: string | null;
          project_id: string | null;
        }
      | null;

    if (decision === "confirm") {
      if (!pf) throw new Error("proposed_fact fehlt — kann nicht festschreiben");

      // 2a. canonical_facts schreiben ---------------------------------------
      // project_id ist NOT NULL — V1: wir nehmen project_id vom proposed_fact
      // oder erstellen lazy ein Default-Projekt, falls noch keines existiert.
      let project_id = pf.project_id;
      if (!project_id) {
        const { data: existingProj } = await admin
          .from("projects")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (existingProj) {
          project_id = existingProj.id;
        } else {
          const { data: newProj, error: pErr } = await admin
            .from("projects")
            .insert({
              user_id: user.id,
              name: "Allgemein",
              description: "Standardprojekt für unsortierte Inputs",
            })
            .select("id")
            .single();
          if (pErr) throw new Error(`Default-Projekt: ${pErr.message}`);
          project_id = newProj.id;
        }
      }

      const { data: cf, error: cfErr } = await admin
        .from("canonical_facts")
        .insert({
          user_id: user.id,
          project_id,
          fact_type: pf.fact_type as never,
          content: pf.content,
          source_proposed_fact_id: pf.id,
          provenance: {
            source_id: pf.source_id,
            parsed_document_id: pf.parsed_document_id,
            extraction_run_id: pf.extraction_run_id,
            confidence: pf.confidence,
            committed_at: new Date().toISOString(),
          },
        })
        .select("id")
        .single();
      if (cfErr) throw new Error(`canonical_facts: ${cfErr.message}`);

      // 2b. change_event ----------------------------------------------------
      const eventType = (pf.delta_type ?? "add") as
        | "confirm"
        | "add"
        | "replace"
        | "contradict"
        | "merge"
        | "discard";
      await admin.from("change_events").insert({
        user_id: user.id,
        project_id,
        canonical_fact_id: cf!.id,
        review_case_id,
        event_type: eventType,
        new_value: pf.content,
        previous_value: null,
      });

      await admin
        .from("proposed_facts")
        .update({ status: "committed" })
        .eq("id", pf.id);

      await admin
        .from("review_cases")
        .update({
          box_state: "bestaetigt",
          user_decision: user_decision ?? { decision: "confirm" },
        })
        .eq("id", review_case_id);
    } else {
      // reject
      if (pf) {
        await admin.from("proposed_facts").update({ status: "rejected" }).eq("id", pf.id);
      }
      await admin
        .from("review_cases")
        .update({
          box_state: "verworfen",
          user_decision: user_decision ?? { decision: "reject" },
        })
        .eq("id", review_case_id);
    }

    // 3. Session-Fortschritt aktualisieren -----------------------------------
    const { data: caseStats } = await admin
      .from("review_cases")
      .select("box_state")
      .eq("session_id", rc.session_id);
    const total = caseStats?.length ?? 0;
    const resolved =
      caseStats?.filter((c) =>
        ["bestaetigt", "verworfen", "eskaliert"].includes(c.box_state),
      ).length ?? 0;

    await admin
      .from("dialog_sessions")
      .update({
        resolved_boxes: resolved,
        total_boxes: total,
        status: total > 0 && resolved >= total ? "completed" : "in_progress",
      })
      .eq("id", rc.session_id);

    return ok({});
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("commit-fact error:", msg);
    return fail(msg, 500);
  }
});

function ok(payload: unknown) {
  return new Response(JSON.stringify({ ok: true, ...payload as object }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function fail(msg: string, status = 500) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
