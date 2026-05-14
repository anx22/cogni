// =============================================================================
//  intake-understand
// -----------------------------------------------------------------------------
//  Schritt 2 der Pipeline: aus rohen Inhalten werden Vorschläge.
//
//  Wird aufgerufen
//    - von intake-process (für Dateien, nach dem Parsing)
//    - direkt von useIntake (für Notizen/Links)
//    - per Retry-Knopf vom Frontend (mit attempt_n+1 implizit, der Counter
//      wird hier hochgezählt)
//
//  Phase 7.5 — Hardening + Projektzuordnung:
//    - eigene Statusspur auf assets.understanding_status
//    - Idempotenz: laufende/fertige Assets werden nicht erneut verarbeitet
//    - Lexikalisches Scoring + Agent-Tie-Breaker für Projektzuordnung
//    - Zuordnungsbox als erste Box wenn unsicher
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  ASSIGNMENT_CONFIDENT_THRESHOLD,
  ASSIGNMENT_UNCERTAIN_THRESHOLD,
  mapToBoxType,
  segmentsToText,
  type DeltaType,
  type FactType,
} from "../_shared/agentConfig.ts";
import {
  callExtractFacts,
  callSuggestAssignment,
  AgentRateLimitError,
  AgentPaymentError,
  AgentTimeoutError,
  type ExtractedFact,
  type AssignmentSuggestion,
} from "../_shared/agentClient.ts";
import { loadProjectContexts, scoreProjects } from "../_shared/projectScoring.ts";
import { createLogger } from "../_shared/logger.ts";
import { withErrorBoundary } from "../_shared/withErrorBoundary.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  asset_id: string;
  retry?: boolean;
  // Optionaler Kontext aus dem Projekt-Graphen (Graphiti), vom AOL-context_loader
  // mitgegeben. Reines Prompt-Enrichment — bei fehlendem Wert läuft alles wie bisher.
  graph_hint?: string | null;
}

Deno.serve(withErrorBoundary("intake-understand", async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);
  const log = createLogger({ fn: "intake-understand", client: admin });
  log.stage("start", "request received");

  let asset_id = "";
  try {
    const body = (await req.json()) as Payload;
    asset_id = body.asset_id;
    const isRetry = !!body.retry;
    const graphHint = typeof body.graph_hint === "string" ? body.graph_hint : null;
    if (!asset_id) throw new Error("asset_id fehlt");
    log.bind({ assetId: asset_id });
    log.stage("input", "payload parsed", { retry: isRetry, has_graph_hint: !!graphHint });

    // 1. Asset laden ----------------------------------------------------------
    const { data: asset, error: aErr } = await admin
      .from("assets")
      .select("*")
      .eq("id", asset_id)
      .single();
    if (aErr || !asset) throw new Error(`Asset nicht gefunden: ${aErr?.message}`);
    log.bind({ userId: asset.user_id, projectId: asset.project_id });
    log.stage("asset.loaded", "asset loaded", { understanding_status: asset.understanding_status });

    // 1a. Idempotenz: schon laufend/fertig → nichts tun (außer Retry)
    if (
      !isRetry &&
      ["running", "review_ready", "empty"].includes(asset.understanding_status)
    ) {
      log.stage("idempotent.skip", "asset already in terminal/running state", { status: asset.understanding_status });
      return ok({ skipped: true, status: asset.understanding_status });
    }

    // 1b. Status auf running setzen, attempt hochzählen
    const attempt = (asset.understanding_attempt ?? 0) + (isRetry ? 1 : 0);
    await admin
      .from("assets")
      .update({
        understanding_status: "running",
        understanding_error: null,
        understanding_attempt: attempt,
      })
      .eq("id", asset_id);

    // 2. Roh-Text zusammenbauen ----------------------------------------------
    let text = "";
    let parsed_document_id: string | null = null;

    const meta = (asset.metadata ?? {}) as Record<string, unknown>;
    if (meta.kind === "note" && typeof meta.text === "string") {
      text = meta.text;
      // Stub-parsed_document, damit jeder proposed_fact eine Provenance-Quelle
      // hat (UI-Snippets, RAG-Anker). Notes umgehen Unstructured legitim, aber
      // brauchen trotzdem den Provenance-Ankerpunkt.
      const { data: noteDoc } = await admin
        .from("parsed_documents")
        .insert({
          asset_id,
          user_id: asset.user_id,
          parser_version: "note-direct",
          segments: [{ text: meta.text, kind: "note", offset: 0 }],
          metadata: { source: "note-stub", file_name: asset.file_name },
        })
        .select("id")
        .single();
      parsed_document_id = noteDoc?.id ?? null;
    } else if (meta.kind === "url" && typeof meta.url === "string") {
      text = `Link: ${meta.url}`;
      const { data: urlDoc } = await admin
        .from("parsed_documents")
        .insert({
          asset_id,
          user_id: asset.user_id,
          parser_version: "url-direct",
          segments: [{ text: `Link: ${meta.url}`, kind: "url", offset: 0 }],
          metadata: { source: "url-stub", url: meta.url },
        })
        .select("id")
        .single();
      parsed_document_id = urlDoc?.id ?? null;
    } else {
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
      await setStatus(admin, asset_id, "empty", "Kein Text zum Verstehen vorhanden.");
      return ok({ facts: 0, session_id: null, status: "empty" });
    }

    // Source-Eintrag (heuristische Email-Erkennung)
    const looksLikeEmail =
      /^(from:|to:|subject:|date:|sender:)/im.test(text.slice(0, 600)) ||
      meta.kind === "email";
    const source_type =
      meta.kind === "note" ? "note"
      : meta.kind === "url" ? "link"
      : looksLikeEmail ? "email"
      : "upload";

    const { data: source } = await admin
      .from("sources")
      .insert({
        asset_id,
        user_id: asset.user_id,
        source_type,
        metadata: { file_name: asset.file_name },
      })
      .select("id")
      .single();
    const source_id = source?.id ?? null;

    // 3. Agent: Fakten extrahieren -------------------------------------------
    let extracted: ExtractedFact[] = [];
    try {
      extracted = await callExtractFacts(text, graphHint);
    } catch (err) {
      return await handleAgentError(admin, asset_id, err);
    }

    if (extracted.length === 0) {
      await setStatus(admin, asset_id, "empty", null);
      return ok({ facts: 0, session_id: null, status: "empty" });
    }

    // 4. Projektzuordnung ----------------------------------------------------
    //   a)) Wenn asset.project_id gesetzt (expliziter Drop) → fertig
    //   b) sonst: Lexikalisches Scoring + ggf. Agent-Tie-Breaker
    let assigned_project_id: string | null = asset.project_id ?? null;
    let assignment: {
      mode: "explicit" | "auto" | "uncertain" | "new";
      suggestion?: AssignmentSuggestion | null;
      score?: number;
      candidates: { project_id: string; name: string; score: number; reasons: string[] }[];
      suggested_new_name?: string | null;
      reason_short?: string;
    } = { mode: "explicit", candidates: [] };

    if (!assigned_project_id) {
      const projectCtxs = await loadProjectContexts(admin, asset.user_id);
      const lexical = scoreProjects(text, projectCtxs);
      const top = lexical[0];

      const candidates = lexical.slice(0, 3).map((s) => {
        const p = projectCtxs.find((x) => x.id === s.project_id);
        return { project_id: s.project_id, name: p?.name ?? "?", score: s.score, reasons: s.reasons };
      });

      // Agent nur fragen wenn es überhaupt Projekte gibt
      let suggestion: AssignmentSuggestion | null = null;
      if (projectCtxs.length > 0) {
        try {
          suggestion = await callSuggestAssignment({
            text,
            projects: projectCtxs.map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              topics: p.topics.slice(0, 3),
              stakeholder_initials: p.stakeholders.slice(0, 5).map(initials),
            })),
            lexicalHints: lexical.slice(0, 5),
          });
        } catch (err) {
          // Assignment-Fehler dürfen den Fakten-Pfad nicht killen — wir loggen nur
          log.warn("suggest_assignment.failed", "suggest_project_assignment failed", { error: err instanceof Error ? err.message : String(err) });
        }
      }

      const lexScore = top?.score ?? 0;
      const agentSays = suggestion?.project_id ?? null;
      const agentConfident = (suggestion?.confidence ?? 0) >= 0.6;

      if (
        lexScore >= ASSIGNMENT_CONFIDENT_THRESHOLD &&
        agentSays === top.project_id &&
        agentConfident
      ) {
        assigned_project_id = top.project_id;
        assignment = {
          mode: "auto",
          suggestion,
          score: lexScore,
          candidates,
          reason_short: suggestion?.reason_short ?? top.reasons.join(", "),
        };
      } else if (lexScore >= ASSIGNMENT_UNCERTAIN_THRESHOLD || (suggestion && agentSays)) {
        assignment = {
          mode: "uncertain",
          suggestion,
          score: lexScore,
          candidates,
          reason_short: suggestion?.reason_short,
        };
      } else {
        // Fallback-Kaskade für sauberen Projektnamen:
        //   1. Agent hat suggested_new_name geliefert → nehmen.
        //   2. Quotierten Namen aus reason_short ziehen ("…", „…", '…').
        //   3. Dominanten Stakeholder-Namen aus extracted facts → "X's Projekt".
        //   4. Dateiname ohne Endung.
        //   5. "Neues Projekt".
        const quoted = suggestion?.reason_short?.match(/[„"']([^"„"']{2,40})["""']/);
        const stakeholder = extracted.find((f) => f.fact_type === "stakeholder");
        const stakeholderName =
          (stakeholder?.content as any)?.name?.toString().trim() ||
          stakeholder?.title?.trim();
        const fallbackName =
          suggestion?.suggested_new_name?.trim() ||
          quoted?.[1]?.trim() ||
          (stakeholderName ? `${stakeholderName.split(/\s+/)[0]}s Projekt` : null) ||
          asset.file_name?.replace(/\.[^.]+$/, "").slice(0, 40) ||
          "Neues Projekt";
        assignment = {
          mode: "new",
          suggestion,
          score: lexScore,
          candidates,
          suggested_new_name: fallbackName,
          reason_short: suggestion?.reason_short,
        };
      }
    }

    // 5. Linking + proposed_facts schreiben ----------------------------------
    // Deterministische extraction_run_id (asset_id + attempt) → echte Idempotenz:
    // gleicher Lauf = gleiche ID = unique-Index auf dialog_sessions verhindert Doppel.
    const extraction_run_id = await deterministicRunId(asset_id, attempt);

    const { data: existing } = await admin
      .from("canonical_facts")
      .select("id, fact_type, content")
      .eq("user_id", asset.user_id);

    const proposedRows = extracted.map((f) => {
      const { delta_type, against_fact_id } = linkAgainstExisting(f, existing ?? []);
      return {
        user_id: asset.user_id,
        project_id: assigned_project_id,
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

    // 6. Dialog-Session anlegen ----------------------------------------------
    // Session-Dedup: bestehende offene Sessions für DAS GLEICHE Asset werden
    // 'cancelled' gesetzt + metadata.superseded_by_session_id wird beim
    // späteren Insert nachgereicht. Verhindert das Duplikat-Sessions-Problem,
    // wenn dasselbe Asset re-getriggert wird.
    const { data: priorSessions } = await admin
      .from("dialog_sessions")
      .select("id")
      .eq("user_id", asset.user_id)
      .eq("trigger_ref_id", asset_id)
      .in("status", ["open", "in_progress"]);
    const priorIds = (priorSessions ?? []).map((s: any) => s.id);

    const needsAssignmentBox =
      assignment.mode === "uncertain" || assignment.mode === "new" || assignment.mode === "auto";

    const totalBoxes = insertedFacts!.length + (needsAssignmentBox ? 1 : 0);

    const { data: session, error: sErr } = await admin
      .from("dialog_sessions")
      .insert({
        user_id: asset.user_id,
        project_id: assigned_project_id,
        trigger_type: "intake",
        trigger_ref_id: asset_id,
        status: "open",
        total_boxes: totalBoxes,
        resolved_boxes: 0,
        summary: `Verstehens-Lauf zu „${asset.file_name}"`,
        metadata: {
          extraction_run_id,
          assignment: {
            mode: assignment.mode,
            assigned_project_id,
            score: assignment.score ?? 0,
            agent_reason: assignment.reason_short ?? null,
            suggested_new_name: assignment.suggested_new_name ?? null,
            candidates: assignment.candidates,
          },
        },
      })
      .select("id")
      .single();
    if (sErr) throw new Error(`dialog_sessions: ${sErr.message}`);

    // Vorherige Sessions superseden — jetzt, wo wir die neue ID haben.
    if (priorIds.length > 0) {
      await admin
        .from("dialog_sessions")
        .update({
          status: "cancelled",
          metadata: { superseded_by_session_id: session!.id, superseded_at: new Date().toISOString() },
        })
        .in("id", priorIds);
      // Offene review_cases der alten Sessions auf 'rejected' setzen, damit
      // das UI nicht doppelte Boxen zeigt. (Kein 'dismissed' im Enum.)
      await admin
        .from("review_cases")
        .update({ box_state: "rejected" })
        .in("session_id", priorIds)
        .eq("box_state", "proposed");
    }

    // 7. review_cases ---------------------------------------------------------
    const caseRows: any[] = [];

    if (needsAssignmentBox) {
      // Empfehlung: bei auto = Top-Kandidat, bei uncertain = Top-Kandidat,
      // bei new = nichts (User entscheidet bewusst).
      const recommendedProjectId =
        assignment.mode === "auto" || assignment.mode === "uncertain"
          ? assignment.candidates[0]?.project_id ?? null
          : null;
      caseRows.push({
        user_id: asset.user_id,
        session_id: session!.id,
        proposed_fact_id: null,
        box_type: "assignment",
        box_state: "proposed",
        title:
          assignment.mode === "auto"
            ? `Zuordnung zu „${assignment.candidates[0]?.name ?? "Projekt"}"`
            : assignment.mode === "new"
            ? "Projekt wählen oder neu anlegen"
            : "Welches Projekt passt?",
        description: assignment.reason_short ?? null,
        priority: 1000, // immer ganz oben
        context: {
          assignment_mode: assignment.mode,
          candidates: assignment.candidates,
          recommended_project_id: recommendedProjectId,
          suggested_new_name: assignment.suggested_new_name ?? null,
          agent_reason: assignment.reason_short ?? null,
          asset_id,
        },
      });
    }

    insertedFacts!.forEach((pf, idx) => {
      const orig = extracted[idx];
      const box_type = mapToBoxType(
        (pf.delta_type ?? null) as DeltaType | null,
        pf.fact_type as FactType,
      );
      caseRows.push({
        user_id: asset.user_id,
        session_id: session!.id,
        proposed_fact_id: pf.id,
        box_type,
        box_state: "proposed",
        title: orig.title,
        description: factSummary(orig.fact_type, orig.content) || orig.title,
        priority: Math.round((orig.confidence ?? 0) * 100),
        context: {
          fact_type: orig.fact_type,
          content: orig.content,
          summary: factSummary(orig.fact_type, orig.content),
        },
      });
    });

    const { error: rcErr } = await admin.from("review_cases").insert(caseRows);
    if (rcErr) throw new Error(`review_cases: ${rcErr.message}`);
    log.stage("review_cases.inserted", "cases written", { count: caseRows.length, session_id: session!.id });

    // 8. Status: review_ready
    await setStatus(admin, asset_id, "review_ready", null);
    log.stage("done", "review_ready", { facts: insertedFacts!.length, assignment_mode: assignment.mode });
    await log.flush();

    return ok({
      facts: insertedFacts!.length,
      session_id: session!.id,
      assignment_mode: assignment.mode,
      correlation_id: log.correlationId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("error", msg, err);
    if (asset_id) await setStatus(admin, asset_id, "failed", msg.slice(0, 240));
    await log.flush();
    return fail(msg, 500);
  }
});

// ----------------------------------------------------------------------------

async function setStatus(
  admin: any,
  asset_id: string,
  status: string,
  error: string | null,
) {
  await admin
    .from("assets")
    .update({ understanding_status: status, understanding_error: error })
    .eq("id", asset_id);
}

async function handleAgentError(admin: any, asset_id: string, err: unknown) {
  if (err instanceof AgentRateLimitError) {
    await setStatus(admin, asset_id, "rate_limited", "Agent ist gerade überlastet.");
    return fail("rate_limited", 429);
  }
  if (err instanceof AgentPaymentError) {
    await setStatus(admin, asset_id, "payment_required", "Agent benötigt Credits.");
    return fail("payment_required", 402);
  }
  if (err instanceof AgentTimeoutError) {
    await setStatus(admin, asset_id, "failed", "Agent hat zu lange gebraucht.");
    return fail("agent_timeout", 504);
  }
  const msg = err instanceof Error ? err.message : String(err);
  await setStatus(admin, asset_id, "failed", msg.slice(0, 240));
  return fail(msg, 500);
}

function linkAgainstExisting(
  f: ExtractedFact,
  existing: { id: string; fact_type: string; content: unknown }[],
): { delta_type: DeltaType; against_fact_id: string | null } {
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

/** Klartext-Summary pro Fact-Type — kein Roh-JSON ans UI. */
function factSummary(factType: string, c: Record<string, unknown>): string {
  const s = (k: string) => (typeof c[k] === "string" ? (c[k] as string) : "");
  switch (factType) {
    case "stakeholder": {
      const parts = [s("name"), s("role") && `(${s("role")})`, s("organization"), s("email")].filter(Boolean);
      return parts.join(" · ");
    }
    case "decision": return s("decision") || s("title") || "Entscheidung";
    case "task": return s("task") || s("title") || "Aufgabe";
    case "deadline": {
      const what = s("what") || s("title") || "Termin";
      const when = s("when") || s("due_date");
      return when ? `${what} — ${when}` : what;
    }
    case "topic": return s("topic") || s("title") || "Thema";
    case "open_point": return s("title") || s("question") || "Offener Punkt";
    case "reference": return s("description") || s("title") || "Referenz";
    default: return s("title") || s("summary") || "";
  }
}

async function deterministicRunId(asset_id: string, attempt: number): Promise<string> {
  // SHA-256(asset_id|attempt) → die ersten 16 Bytes als UUID v4-ähnlich formatiert.
  const data = new TextEncoder().encode(`${asset_id}|${attempt}`);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  const b = hash.slice(0, 16);
  // Variant + Version Bits setzen, damit es eine valide UUID ist
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10
  const hex = Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

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
