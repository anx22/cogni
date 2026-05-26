// =============================================================================
//  commit-fact / gapDetector — Welle B-W3 (deterministisch, fail-soft).
// -----------------------------------------------------------------------------
//  Erkennt nach jedem Canonical-Commit Lücken im Projektzustand und schreibt
//  sie nach `gap_signals`. UI (`GapBox`, `mappers/gaps.ts`) liest realtime.
//
//  Kinds (Stufe 1):
//    - deadline_without_owner: Deadline ohne assignee/owner/responsible.
//    - decision_without_deadline: Decision ohne korrespondierende Deadline.
//    - task_without_due_date: Task ohne due_date.
//
//  Idempotenz: pro (project_id, canonical_fact_id, metadata->>gap_kind, status='open').
//  Fail-soft: jede Exception wird geloggt, niemals geworfen.
// =============================================================================
/* eslint-disable @typescript-eslint/no-explicit-any */
// deno-lint-ignore-file no-explicit-any

import type { Logger } from "../_shared/logger.ts";

type Row = { id: string; fact_type: string; content: any };

export type GapKind =
  | "deadline_without_owner"
  | "decision_without_deadline"
  | "task_without_due_date";

export type DetectedGap = {
  kind: GapKind;
  canonical_fact_id: string;
  title: string;
  impact: string;
  affects: string;
};

const IMPACT: Record<GapKind, string> = {
  deadline_without_owner: "Niemand verantwortlich — Frist droht zu verstreichen",
  decision_without_deadline: "Entscheidung ohne Umsetzungsfrist — Stillstand möglich",
  task_without_due_date: "Aufgabe ohne Frist — Priorisierung unklar",
};

const AFFECTS: Record<GapKind, string> = {
  deadline_without_owner: "Verantwortlichkeit",
  decision_without_deadline: "Umsetzung",
  task_without_due_date: "Planung",
};

function norm(s: unknown): string {
  return typeof s === "string" ? s.trim().toLowerCase() : "";
}
function titleOf(c: any): string {
  return (
    (typeof c?.title === "string" && c.title) || (typeof c?.name === "string" && c.name) || "—"
  );
}
function nonEmpty(v: unknown): boolean {
  return typeof v === "string" ? v.trim().length > 0 : !!v;
}

/**
 * Pure: vergleicht den frischen Fakt gegen den Bestand und gibt Gaps zurück.
 */
export function detectGapsPure(fresh: Row, projectFacts: Row[]): DetectedGap[] {
  const out: DetectedGap[] = [];
  const c = (fresh.content ?? {}) as any;
  const title = titleOf(c);

  if (fresh.fact_type === "deadline") {
    const hasOwner =
      nonEmpty(c.assignee) ||
      nonEmpty(c.owner) ||
      nonEmpty(c.responsible) ||
      nonEmpty(c.assigned_to);
    if (!hasOwner) {
      out.push({
        kind: "deadline_without_owner",
        canonical_fact_id: fresh.id,
        title: `Verantwortlicher fehlt für „${title}"`,
        impact: IMPACT.deadline_without_owner,
        affects: AFFECTS.deadline_without_owner,
      });
    }
  }

  if (fresh.fact_type === "decision") {
    const t = norm(title);
    const hasMatchingDeadline = projectFacts.some(
      (o) => o.fact_type === "deadline" && norm(titleOf(o.content)) === t,
    );
    if (!hasMatchingDeadline) {
      out.push({
        kind: "decision_without_deadline",
        canonical_fact_id: fresh.id,
        title: `Umsetzungsfrist fehlt für „${title}"`,
        impact: IMPACT.decision_without_deadline,
        affects: AFFECTS.decision_without_deadline,
      });
    }
  }

  if (fresh.fact_type === "task") {
    if (!nonEmpty(c.due_date)) {
      out.push({
        kind: "task_without_due_date",
        canonical_fact_id: fresh.id,
        title: `Frist fehlt für Aufgabe „${title}"`,
        impact: IMPACT.task_without_due_date,
        affects: AFFECTS.task_without_due_date,
      });
    }
  }

  return out;
}

/**
 * Side-effect: liest Bestand des Projekts (nur relevante Typen),
 * ruft `detectGapsPure`, schreibt neue gap_signals idempotent.
 * Niemals throw.
 */
export async function detectAndPersistGaps(
  admin: any,
  args: {
    user_id: string;
    project_id: string;
    canonical_fact_id: string;
    fact_type: string;
    content: any;
    log: Logger;
  },
): Promise<DetectedGap[]> {
  const { user_id, project_id, canonical_fact_id, fact_type, content, log } = args;
  if (fact_type !== "deadline" && fact_type !== "decision" && fact_type !== "task") {
    return [];
  }

  try {
    let others: Row[] = [];
    if (fact_type === "decision") {
      const { data, error } = await admin
        .from("canonical_facts")
        .select("id, fact_type, content")
        .eq("project_id", project_id)
        .eq("fact_type", "deadline");
      if (error) {
        log.warn("gap.read_failed", "load deadlines failed", { error: error.message });
        return [];
      }
      others = (data ?? []) as Row[];
    }

    const detected = detectGapsPure({ id: canonical_fact_id, fact_type, content }, others);
    if (detected.length === 0) return [];

    // Idempotenz: existierende offene Gaps für diesen Fakt+Kind ausfiltern.
    const { data: existing } = await admin
      .from("gap_signals")
      .select("canonical_fact_id, metadata, status")
      .eq("project_id", project_id)
      .eq("canonical_fact_id", canonical_fact_id)
      .eq("status", "open");
    const seen = new Set(
      (existing ?? []).map((r: any) => `${r.canonical_fact_id}|${r.metadata?.gap_kind ?? ""}`),
    );

    const toInsert = detected
      .filter((d) => !seen.has(`${d.canonical_fact_id}|${d.kind}`))
      .map((d) => ({
        user_id,
        project_id,
        canonical_fact_id: d.canonical_fact_id,
        title: d.title,
        impact: d.impact,
        affects: d.affects,
        status: "open" as const,
        metadata: { gap_kind: d.kind, source: "commit-fact/gapDetector" },
      }));

    if (toInsert.length === 0) return detected;

    const { error: insErr } = await admin.from("gap_signals").insert(toInsert);
    if (insErr) {
      log.warn("gap.insert_failed", "gap_signals insert failed", { error: insErr.message });
      return detected;
    }
    log.stage("gap.detected", "gap_signals written", {
      count: toInsert.length,
      kinds: toInsert.map((r) => r.metadata.gap_kind),
    });
    return detected;
  } catch (e) {
    log.warn("gap.detector_threw", "unexpected error", {
      error: e instanceof Error ? e.message : String(e),
    });
    return [];
  }
}
