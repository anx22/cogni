// =============================================================================
//  commit-fact / kernel — pure logic, testbar ohne HTTP/Auth.
// =============================================================================
/* eslint-disable @typescript-eslint/no-explicit-any */
// deno-lint-ignore-file no-explicit-any

import type { Logger } from "../_shared/logger.ts";
import { handleAssignment } from "./assignment.ts";
import { updateSessionProgress, writeProjectSnapshot } from "./snapshot.ts";
import { notifyAol } from "./notifications.ts";
import { mirrorToGraphiti } from "./mirror.ts";
import { detectAndPersistConflicts } from "./conflictDetector.ts";
import { detectAndPersistGaps } from "./gapDetector.ts";
import { detectAndPersistDependencies } from "./dependencyDetector.ts";

interface Payload {
  review_case_id: string;
  decision: "confirm" | "reject";
  user_decision?: Record<string, unknown> | null;
}

export interface CommitFactDeps {
  admin: any;
  user: { id: string };
  payload: Payload;
  log: Logger;
  notifyAolFn?: typeof notifyAol;
  mirrorFn?: typeof mirrorToGraphiti;
}
export type CommitFactResult =
  | { ok: true; canonical_fact_id?: string }
  | { ok: false; status: number; code?: string; error: string };

export async function commitFact(deps: CommitFactDeps): Promise<CommitFactResult> {
  const { admin, user, payload, log } = deps;
  const notifyAolImpl = deps.notifyAolFn ?? notifyAol;
  const mirrorImpl = deps.mirrorFn ?? mirrorToGraphiti;

  const { review_case_id, decision, user_decision } = payload;
  if (!review_case_id || !decision) {
    return { ok: false, status: 400, error: "review_case_id + decision erforderlich" };
  }
  log.stage("input", "payload parsed", { review_case_id, decision });

  const { data: rc, error: rcErr } = await admin
    .from("review_cases")
    .select("*, proposed_fact:proposed_facts(*), session:dialog_sessions(*)")
    .eq("id", review_case_id)
    .single();
  if (rcErr || !rc) return { ok: false, status: 404, error: `review_case nicht gefunden: ${rcErr?.message ?? "n/a"}` };
  if (rc.user_id !== user.id) return { ok: false, status: 403, error: "kein Zugriff" };
  log.bind({ sessionId: rc.session_id, projectId: rc.session?.project_id ?? null });
  log.stage("review_case.loaded", "case loaded", { box_type: rc.box_type, fact_type: rc.proposed_fact?.fact_type });

  // ==== Sonderfall: Zuordnungsbox =====================================
  if (rc.box_type === "assignment") {
    if (decision === "reject") {
      return {
        ok: false,
        status: 400,
        code: "ASSIGNMENT_REQUIRED",
        error: "Projektzuordnung ist erforderlich und kann nicht verworfen werden.",
      };
    }
    await handleAssignment(admin, user.id, rc, decision, user_decision);
    await updateSessionProgress(admin, rc.session_id);
    log.stage("assignment.done", "project assigned");
    return { ok: true };
  }

  // ==== Guard: andere Boxen brauchen erst die Zuordnung ===============
  {
    const sessionMeta = (rc.session?.metadata ?? {}) as Record<string, any>;
    const hasAssignment =
      !!sessionMeta?.assignment?.assigned_project_id || !!rc.session?.project_id;
    if (!hasAssignment) {
      const { data: assignmentCase } = await admin
        .from("review_cases")
        .select("box_state")
        .eq("session_id", rc.session_id)
        .eq("box_type", "assignment")
        .maybeSingle();
      if (assignmentCase && assignmentCase.box_state !== "confirmed") {
        return {
          ok: false,
          status: 200,
          code: "NEEDS_ASSIGNMENT",
          error: "Bitte zuerst die Projektzuordnung entscheiden.",
        };
      }
    }
  }

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
    if (!pf) return { ok: false, status: 400, error: "proposed_fact fehlt — kann nicht festschreiben" };

    const sessionMeta = (rc.session?.metadata ?? {}) as Record<string, any>;
    const sessionProjectId =
      sessionMeta?.assignment?.assigned_project_id ?? rc.session?.project_id ?? null;
    const project_id = sessionProjectId ?? pf.project_id;

    if (!project_id) {
      return {
        ok: false,
        status: 200,
        code: "NEEDS_ASSIGNMENT",
        error: "Bitte zuerst die Projektzuordnung entscheiden.",
      };
    }

    const ud = (user_decision ?? {}) as Record<string, unknown>;
    const correctedContent =
      ud && typeof ud.content === "object" && ud.content !== null
        ? (ud.content as Record<string, unknown>)
        : null;
    const wasCorrected =
      !!correctedContent &&
      JSON.stringify(correctedContent) !== JSON.stringify(pf.content);
    const finalContent = correctedContent ?? pf.content;
    const correctionReason = typeof ud.reason === "string" ? ud.reason : null;

    const { data: cf, error: cfErr } = await admin
      .from("canonical_facts")
      .insert({
        user_id: user.id,
        project_id,
        fact_type: pf.fact_type as never,
        content: finalContent,
        source_proposed_fact_id: pf.id,
        provenance: {
          source_id: pf.source_id,
          parsed_document_id: pf.parsed_document_id,
          extraction_run_id: pf.extraction_run_id,
          confidence: pf.confidence,
          committed_at: new Date().toISOString(),
          corrected: wasCorrected,
        },
      })
      .select("id")
      .single();
    if (cfErr) return { ok: false, status: 500, error: `canonical_facts: ${cfErr.message}` };
    log.bind({ projectId: project_id });
    log.stage("canonical_fact.inserted", "canonical fact written", { canonical_fact_id: cf!.id, fact_type: pf.fact_type, corrected: wasCorrected });

    await mirrorImpl(admin, {
      canonical_fact_id: cf!.id,
      project_id,
      fact_type: pf.fact_type,
      content: finalContent,
    }, log);

    // B-W2/B-W3/B-W4: Konflikte + Gaps + Dependencies deterministisch (fail-soft, parallel).
    await Promise.all([
      detectAndPersistConflicts(admin, {
        user_id: user.id,
        project_id,
        canonical_fact_id: cf!.id,
        fact_type: pf.fact_type,
        content: finalContent,
        log,
      }),
      detectAndPersistGaps(admin, {
        user_id: user.id,
        project_id,
        canonical_fact_id: cf!.id,
        fact_type: pf.fact_type,
        content: finalContent,
        log,
      }),
      detectAndPersistDependencies(admin, {
        user_id: user.id,
        project_id,
        canonical_fact_id: cf!.id,
        fact_type: pf.fact_type,
        content: finalContent,
        log,
      }),
    ]);

    if (wasCorrected) {
      await admin.from("corrections").insert({
        user_id: user.id,
        canonical_fact_id: cf!.id,
        previous_value: pf.content,
        corrected_value: finalContent,
        reason: correctionReason,
      });
    }

    if (pf.fact_type === "open_point") {
      const c = (finalContent ?? {}) as any;
      await admin.from("gap_signals").insert({
        user_id: user.id,
        project_id,
        canonical_fact_id: cf!.id,
        title: c.title ?? "Offener Punkt",
        impact: typeof c.impact === "string" ? c.impact : null,
        affects: typeof c.affects === "string" ? c.affects : null,
        status: "open",
      });
    }
    if (pf.fact_type === "reference") {
      const c = (finalContent ?? {}) as any;
      await admin.from("dependencies").insert({
        user_id: user.id,
        project_id,
        source_id: cf!.id,
        source_type: "canonical_fact",
        target_id: cf!.id,
        target_type: typeof c.target_type === "string" ? c.target_type : "external",
        dependency_type: "haengt_ab_von",
        description: typeof c.description === "string" ? c.description : null,
      });
    }

    const eventType = wasCorrected
      ? "replace"
      : ((pf.delta_type ?? "add") as
          | "confirm" | "add" | "replace" | "contradict" | "merge" | "discard");
    await admin.from("change_events").insert({
      user_id: user.id,
      project_id,
      canonical_fact_id: cf!.id,
      review_case_id,
      event_type: eventType,
      new_value: finalContent,
      previous_value: wasCorrected ? pf.content : null,
    });
    log.stage("change_event.inserted", "delta logged", { event_type: eventType });

    await admin.from("proposed_facts").update({ status: "committed" }).eq("id", pf.id);
    await admin
      .from("review_cases")
      .update({ box_state: "confirmed", user_decision: user_decision ?? { decision: "confirm" } })
      .eq("id", review_case_id);

    await writeProjectSnapshot(admin, user.id, project_id, {
      trigger_event: `commit:${pf.fact_type}:${eventType}`,
      canonical_fact_id: cf!.id,
      log,
    });

    await updateSessionProgress(admin, rc.session_id);
    notifyAolImpl({ review_case_id, decision, user_id: user.id })
      .catch((e) => log.warn("aol.notify_failed", "aol-confirm notify failed", { error: e?.message ?? String(e) }));

    return { ok: true, canonical_fact_id: cf!.id };
  } else {
    if (pf) {
      await admin.from("proposed_facts").update({ status: "rejected" }).eq("id", pf.id);
    }
    await admin
      .from("review_cases")
      .update({ box_state: "rejected", user_decision: user_decision ?? { decision: "reject" } })
      .eq("id", review_case_id);
    await updateSessionProgress(admin, rc.session_id);
    notifyAolImpl({ review_case_id, decision, user_id: user.id })
      .catch((e) => log.warn("aol.notify_failed", "aol-confirm notify failed", { error: e?.message ?? String(e) }));
    return { ok: true };
  }
}
