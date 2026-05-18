// =============================================================================
//  intake-understand / understandRun — Orchestrierungs-Kernel.
// -----------------------------------------------------------------------------
//  Pure(-ish) Orchestrierung: Auth/CORS/Response liegen in index.ts.
//  Returnt ein typisiertes Ergebnis statt Response.
// =============================================================================
// deno-lint-ignore-file no-explicit-any

import {
  ASSIGNMENT_CONFIDENT_THRESHOLD,
  ASSIGNMENT_UNCERTAIN_THRESHOLD,
  SILENT_COMMIT_CONFIDENCE,
  mapToBoxType,
  segmentsToText,
  type DeltaType,
  type FactType,
  type Modality,
} from "../_shared/agentConfig.ts";
import {
  callExtractFacts,
  callSuggestAssignment,
  type ExtractedFact,
  type AssignmentSuggestion,
} from "../_shared/agentClient.ts";
import { loadProjectContexts, scoreProjects } from "../_shared/projectScoring.ts";
import type { Logger } from "../_shared/logger.ts";
import { summarizeFact } from "./factRules.ts";
import { linkAgainstExisting } from "./linker.ts";
import { searchEntities } from "../_shared/clients/graphitiSearch.ts";
import { deterministicRunId, initials } from "./helpers.ts";
import { setStatus, handleAgentError } from "./agentBridge.ts";

export interface UnderstandPayload {
  asset_id: string;
  retry?: boolean;
  graph_hint?: string | null;
}

export type UnderstandResult =
  | { ok: true; status?: number; body: Record<string, unknown> }
  | { ok: false; status: number; error: string };

export async function runUnderstand(args: {
  admin: any;
  payload: UnderstandPayload;
  log: Logger;
}): Promise<UnderstandResult> {
  const { admin, payload, log } = args;
  const asset_id = payload.asset_id;
  if (!asset_id) return { ok: false, status: 400, error: "asset_id fehlt" };

  const isRetry = !!payload.retry;
  const graphHint = typeof payload.graph_hint === "string" ? payload.graph_hint : null;

  log.bind({ assetId: asset_id });
  log.stage("input", "payload parsed", { retry: isRetry, has_graph_hint: !!graphHint });

  // 1. Asset laden
  const { data: asset, error: aErr } = await admin
    .from("assets")
    .select("*")
    .eq("id", asset_id)
    .single();
  if (aErr || !asset) {
    return { ok: false, status: 500, error: `Asset nicht gefunden: ${aErr?.message}` };
  }
  log.bind({ userId: asset.user_id, projectId: asset.project_id });
  log.stage("asset.loaded", "asset loaded", { understanding_status: asset.understanding_status });

  // 1a. Idempotenz
  if (
    !isRetry &&
    ["running", "review_ready", "empty"].includes(asset.understanding_status)
  ) {
    log.stage("idempotent.skip", "asset already in terminal/running state", { status: asset.understanding_status });
    return { ok: true, body: { skipped: true, status: asset.understanding_status } };
  }

  // 1b. Status auf running, attempt hochzählen
  const attempt = (asset.understanding_attempt ?? 0) + (isRetry ? 1 : 0);
  await admin
    .from("assets")
    .update({
      understanding_status: "running",
      understanding_error: null,
      understanding_attempt: attempt,
    })
    .eq("id", asset_id);

  // 2. Roh-Text zusammenbauen
  let text = "";
  let parsed_document_id: string | null = null;
  const meta = (asset.metadata ?? {}) as Record<string, unknown>;

  if (meta.kind === "note" && typeof meta.text === "string") {
    text = meta.text;
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
    return { ok: true, body: { facts: 0, session_id: null, status: "empty" } };
  }

  // Source-Eintrag
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

  // 3. Agent: Fakten extrahieren
  let extracted: ExtractedFact[] = [];
  try {
    extracted = await callExtractFacts(text, graphHint);
  } catch (err) {
    const outcome = await handleAgentError(admin, asset_id, err);
    return { ok: false, status: outcome.status, error: outcome.error };
  }

  if (extracted.length === 0) {
    await setStatus(admin, asset_id, "empty", null);
    return { ok: true, body: { facts: 0, session_id: null, status: "empty" } };
  }

  // 4. Projektzuordnung
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

  // 5. Linking + proposed_facts
  const extraction_run_id = await deterministicRunId(asset_id, attempt);

  const { data: existing } = await admin
    .from("canonical_facts")
    .select("id, fact_type, content")
    .eq("user_id", asset.user_id);

  // Graph-Hits pro Fakt vorab holen (B-W1, fail-soft).
  const linkableHits = new Map<number, Awaited<ReturnType<typeof searchEntities>>>();
  if (assigned_project_id) {
    await Promise.all(
      extracted.map(async (f, idx) => {
        const q = (f.title ?? "").trim();
        if (!q) return;
        try {
          const hits = await searchEntities({ project_id: assigned_project_id!, query: q, k: 5 });
          linkableHits.set(idx, hits);
        } catch {
          linkableHits.set(idx, null);
        }
      }),
    );
  }

  const proposedRows = extracted.map((f, idx) => {
    const { delta_type, against_fact_id } = linkAgainstExisting(f, existing ?? [], {
      searchHits: linkableHits.get(idx) ?? null,
    });
    return {
      user_id: asset.user_id,
      project_id: assigned_project_id,
      source_id,
      parsed_document_id,
      fact_type: f.fact_type,
      // Modalitäts-Vertrag wird in content mitgeschrieben — DB-Schema unverändert.
      content: {
        title: f.title,
        modality: f.modality ?? "assertion",
        attaches_to: f.attaches_to ?? null,
        asks: f.asks ?? null,
        understood: f.understood ?? f.title,
        evidence: f.evidence ?? null,
        ...f.content,
      },
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

  // 6. Dialog-Session
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

  if (priorIds.length > 0) {
    await admin
      .from("dialog_sessions")
      .update({
        status: "cancelled",
        metadata: { superseded_by_session_id: session!.id, superseded_at: new Date().toISOString() },
      })
      .in("id", priorIds);
    await admin
      .from("review_cases")
      .update({ box_state: "rejected" })
      .in("session_id", priorIds)
      .eq("box_state", "proposed");
  }

  // 7. review_cases
  const caseRows: any[] = [];

  if (needsAssignmentBox) {
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
      priority: 1000,
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

  // Stille Substanz: hochkonfidente, fragelose, konfliktfreie Assertions wandern
  // direkt als bestätigt rein — keine Pflicht-Box. Drift-Telemetrie sammelt
  // "unclear"-Items für späteren Schema-Vorschlag.
  let silentCount = 0;
  const unclearSamples: Array<{ title: string; understood: string | null }> = [];

  insertedFacts!.forEach((pf, idx) => {
    const orig = extracted[idx];
    const modality: Modality | null = (orig.modality as Modality) ?? null;
    const box_type = mapToBoxType(
      (pf.delta_type ?? null) as DeltaType | null,
      pf.fact_type as FactType,
      modality,
    );

    const isConflict = box_type === "conflict";
    const hasAsks = !!(orig.asks && orig.asks.trim().length > 0);
    const canSilent =
      !isConflict &&
      !hasAsks &&
      (orig.confidence ?? 0) >= SILENT_COMMIT_CONFIDENCE &&
      modality !== "unclear" &&
      modality !== "question";

    if (canSilent) {
      silentCount += 1;
      return; // keine Box
    }

    if (modality === "unclear") {
      unclearSamples.push({ title: orig.title, understood: orig.understood ?? null });
    }

    caseRows.push({
      user_id: asset.user_id,
      session_id: session!.id,
      proposed_fact_id: pf.id,
      box_type,
      box_state: "proposed",
      title: orig.title,
      description: summarizeFact(orig.fact_type, orig.content) || orig.title,
      priority: Math.round((orig.confidence ?? 0) * 100),
      context: {
        fact_type: orig.fact_type,
        content: orig.content,
        summary: summarizeFact(orig.fact_type, orig.content),
        // Modalitäts-Vertrag fürs Frontend.
        modality: modality ?? "assertion",
        attaches_to: orig.attaches_to ?? null,
        asks: orig.asks ?? null,
        understood: orig.understood ?? null,
        evidence: orig.evidence ?? null,
      },
    });
  });

  if (silentCount > 0) {
    caseRows.push({
      user_id: asset.user_id,
      session_id: session!.id,
      proposed_fact_id: null,
      box_type: "note",
      box_state: "confirmed",
      title: `${silentCount} Punkte still übernommen`,
      description: "Hochkonfidente Aussagen, keine Frage offen — direkt in den Projektzustand.",
      priority: 0,
      context: { kind: "silent_substanz", count: silentCount },
    });
  }

  if (unclearSamples.length > 0) {
    log.warn("modality.unclear", "agent lieferte unclear-items", {
      count: unclearSamples.length,
      samples: unclearSamples.slice(0, 5),
    });
  }

  const { error: rcErr } = await admin.from("review_cases").insert(caseRows);
  if (rcErr) throw new Error(`review_cases: ${rcErr.message}`);
  log.stage("review_cases.inserted", "cases written", { count: caseRows.length, session_id: session!.id });

  // 8. Status: review_ready
  await setStatus(admin, asset_id, "review_ready", null);
  log.stage("done", "review_ready", { facts: insertedFacts!.length, assignment_mode: assignment.mode });

  return {
    ok: true,
    body: {
      facts: insertedFacts!.length,
      session_id: session!.id,
      assignment_mode: assignment.mode,
    },
  };
}
