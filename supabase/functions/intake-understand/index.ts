// =============================================================================
//  intake-understand
// -----------------------------------------------------------------------------
//  Schritt 2 der Pipeline: aus rohen Inhalten werden Vorschläge.
//
//  Wird aufgerufen
//    - von intake-process (für Dateien, nach dem Parsing)
//    - direkt von useIntake (für Notizen/Links)
//
//  Ablauf:
//    1. Asset laden, Roh-Text bauen
//    2. Agent aufrufen (siehe _shared/agentClient.ts) → ExtractedFact[]
//    3. Pro Fakt: einfaches Linking gegen canonical_facts (Name/Title-Match)
//    4. proposed_facts schreiben (mit extraction_run_id)
//    5. Wenn >0 Fakten: dialog_session + ein review_case pro Fakt
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  mapToBoxType,
  segmentsToText,
  type DeltaType,
  type FactType,
} from "../_shared/agentConfig.ts";
import {
  callExtractFacts,
  AgentRateLimitError,
  AgentPaymentError,
  type ExtractedFact,
} from "../_shared/agentClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  asset_id: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  let asset_id = "";
  try {
    const body = (await req.json()) as Payload;
    asset_id = body.asset_id;
    if (!asset_id) throw new Error("asset_id fehlt");

    // 1. Asset laden ----------------------------------------------------------
    const { data: asset, error: aErr } = await admin
      .from("assets")
      .select("*")
      .eq("id", asset_id)
      .single();
    if (aErr || !asset) throw new Error(`Asset nicht gefunden: ${aErr?.message}`);

    // 2. Roh-Text zusammenbauen ----------------------------------------------
    let text = "";
    let parsed_document_id: string | null = null;

    const meta = (asset.metadata ?? {}) as Record<string, unknown>;
    if (meta.kind === "note" && typeof meta.text === "string") {
      text = meta.text;
    } else if (meta.kind === "url" && typeof meta.url === "string") {
      // V1: nur die URL selbst — späteres Crawling kommt in Phase 8.
      text = `Link: ${meta.url}`;
    } else {
      // Datei: wir brauchen das geparste Dokument
      const { data: pd } = await admin
        .from("parsed_documents")
        .select("id, segments")
        .eq("asset_id", asset_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (pd) {
        parsed_document_id = pd.id;
        text = segmentsToText(pd.segments);
      }
    }

    if (!text.trim()) {
      console.log(`intake-understand: kein Text für asset ${asset_id}`);
      return ok({ facts: 0, session_id: null });
    }

    // Source-Eintrag (idempotent: wir machen pro Lauf einen)
    const { data: source } = await admin
      .from("sources")
      .insert({
        asset_id,
        user_id: asset.user_id,
        source_type: meta.kind === "note" ? "note" : meta.kind === "url" ? "link" : "upload",
        metadata: { file_name: asset.file_name },
      })
      .select("id")
      .single();
    const source_id = source?.id ?? null;

    // 3. Agent aufrufen -------------------------------------------------------
    let extracted: ExtractedFact[] = [];
    try {
      extracted = await callExtractFacts(text);
    } catch (err) {
      if (err instanceof AgentRateLimitError) {
        return fail("Agent ist gerade überlastet (Rate Limit). Bitte gleich nochmal.", 429);
      }
      if (err instanceof AgentPaymentError) {
        return fail("Agent benötigt aufgeladene Credits.", 402);
      }
      throw err;
    }

    if (extracted.length === 0) {
      console.log(`intake-understand: 0 Fakten extrahiert für asset ${asset_id}`);
      return ok({ facts: 0, session_id: null });
    }

    // 4. Linking + proposed_facts schreiben ----------------------------------
    const extraction_run_id = crypto.randomUUID();

    // Bestehende canonical_facts dieses Users laden — fürs simple Name-Match.
    const { data: existing } = await admin
      .from("canonical_facts")
      .select("id, fact_type, content")
      .eq("user_id", asset.user_id);

    const proposedRows = extracted.map((f) => {
      const { delta_type, against_fact_id } = linkAgainstExisting(
        f,
        existing ?? [],
      );
      return {
        user_id: asset.user_id,
        project_id: asset.project_id, // V1: meistens null
        source_id,
        parsed_document_id,
        fact_type: f.fact_type,
        content: { title: f.title, ...f.content },
        confidence: f.confidence,
        delta_type,
        against_fact_id,
        extraction_run_id,
        status: "pending",
      };
    });

    const { data: insertedFacts, error: pfErr } = await admin
      .from("proposed_facts")
      .insert(proposedRows)
      .select("id, delta_type, fact_type");
    if (pfErr) throw new Error(`proposed_facts: ${pfErr.message}`);

    // 5. Dialog-Session + review_cases ---------------------------------------
    const { data: session, error: sErr } = await admin
      .from("dialog_sessions")
      .insert({
        user_id: asset.user_id,
        project_id: asset.project_id,
        trigger_type: "intake",
        trigger_ref_id: asset_id,
        status: "open",
        total_boxes: insertedFacts!.length,
        resolved_boxes: 0,
        summary: `Verstehens-Lauf zu „${asset.file_name}"`,
        metadata: { extraction_run_id },
      })
      .select("id")
      .single();
    if (sErr) throw new Error(`dialog_sessions: ${sErr.message}`);

    const caseRows = insertedFacts!.map((pf, idx) => {
      const orig = extracted[idx];
      const box_type = mapToBoxType(
        (pf.delta_type ?? null) as DeltaType | null,
        pf.fact_type as FactType,
      );
      return {
        user_id: asset.user_id,
        session_id: session!.id,
        proposed_fact_id: pf.id,
        box_type,
        box_state: "vorgeschlagen" as const,
        title: orig.title,
        description: stringify(orig.content),
        priority: Math.round((orig.confidence ?? 0) * 100),
        context: { fact_type: orig.fact_type, content: orig.content },
      };
    });

    const { error: rcErr } = await admin.from("review_cases").insert(caseRows);
    if (rcErr) throw new Error(`review_cases: ${rcErr.message}`);

    return ok({ facts: insertedFacts!.length, session_id: session!.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("intake-understand error:", msg);
    return fail(msg, 500);
  }
});

// ----------------------------------------------------------------------------

function linkAgainstExisting(
  f: ExtractedFact,
  existing: { id: string; fact_type: string; content: unknown }[],
): { delta_type: DeltaType; against_fact_id: string | null } {
  // Sehr einfaches Linking nach Title/Name. Nur für stakeholder/topic.
  if (f.fact_type !== "stakeholder" && f.fact_type !== "topic") {
    return { delta_type: "add", against_fact_id: null };
  }
  const needle = (f.title ?? "").trim().toLowerCase();
  if (!needle) return { delta_type: "add", against_fact_id: null };

  for (const cf of existing) {
    if (cf.fact_type !== f.fact_type) continue;
    const c = cf.content as Record<string, unknown> | null;
    const hay =
      (typeof c?.title === "string" && c.title) ||
      (typeof c?.name === "string" && c.name) ||
      "";
    if (typeof hay === "string" && hay.trim().toLowerCase() === needle) {
      return { delta_type: "confirm", against_fact_id: cf.id };
    }
  }
  return { delta_type: "add", against_fact_id: null };
}

function stringify(o: Record<string, unknown>): string {
  try {
    return Object.entries(o)
      .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
      .join(" · ");
  } catch {
    return "";
  }
}

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
