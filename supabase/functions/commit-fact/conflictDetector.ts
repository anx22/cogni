// =============================================================================
//  commit-fact / conflictDetector — Welle B-W2 (deterministische Erkennung).
// -----------------------------------------------------------------------------
//  Läuft nach erfolgreichem `canonical_facts.insert` und prüft den frischen
//  Fakt gegen den Bestand desselben Projekts.
//
//  Erkannte Typen (Enum `contradiction_type`):
//    - `deadline`: gleicher normalisierter Title, unterschiedliche due_date
//      (Tagesgenauigkeit, ISO).
//    - `decision`: gleicher normalisierter Title, abweichendes
//      `outcome` / `text` / `summary`.
//
//  Idempotent: existiert für (fact_a, fact_b, type) bereits ein Eintrag,
//  wird nichts geschrieben.
//  Fail-soft: jeder Fehler wird via Logger.warn geloggt, niemals geworfen —
//  Detektor darf den Commit-Pfad nicht abbrechen.
// =============================================================================
/* eslint-disable @typescript-eslint/no-explicit-any */
// deno-lint-ignore-file no-explicit-any

import type { Logger } from "../_shared/logger.ts";

type Row = { id: string; fact_type: string; content: any };

export type DetectedConflict = {
  type: "deadline" | "decision";
  fact_a_id: string;
  fact_b_id: string;
  description: string;
};

function norm(s: unknown): string {
  return typeof s === "string" ? s.trim().toLowerCase() : "";
}

function titleOf(c: any): string {
  return norm(c?.title ?? c?.name ?? "");
}

function dayOf(s: unknown): string | null {
  if (typeof s !== "string" || !s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function decisionPayload(c: any): string {
  return norm(c?.outcome ?? c?.decision ?? c?.text ?? c?.summary ?? "");
}

/**
 * Pure: vergleicht den neuen Fakt mit Kandidatenmenge gleichen Typs.
 */
export function detectConflictsPure(
  fresh: Row,
  others: Row[],
): DetectedConflict[] {
  const out: DetectedConflict[] = [];
  const t = titleOf(fresh.content);
  if (!t) return out;

  if (fresh.fact_type === "deadline") {
    const aDay = dayOf(fresh.content?.due_date);
    if (!aDay) return out;
    for (const o of others) {
      if (o.id === fresh.id || o.fact_type !== "deadline") continue;
      if (titleOf(o.content) !== t) continue;
      const bDay = dayOf(o.content?.due_date);
      if (!bDay || bDay === aDay) continue;
      out.push({
        type: "deadline",
        fact_a_id: fresh.id,
        fact_b_id: o.id,
        description: `Deadline „${fresh.content?.title ?? t}" widerspricht: ${aDay} vs. ${bDay}`,
      });
    }
    return out;
  }

  if (fresh.fact_type === "decision") {
    const aPay = decisionPayload(fresh.content);
    if (!aPay) return out;
    for (const o of others) {
      if (o.id === fresh.id || o.fact_type !== "decision") continue;
      if (titleOf(o.content) !== t) continue;
      const bPay = decisionPayload(o.content);
      if (!bPay || bPay === aPay) continue;
      out.push({
        type: "decision",
        fact_a_id: fresh.id,
        fact_b_id: o.id,
        description: `Entscheidung „${fresh.content?.title ?? t}" widerspricht früherem Stand`,
      });
    }
    return out;
  }

  return out;
}

/**
 * Side-effect: liest Bestand des Projekts, ruft `detectConflictsPure`,
 * inseriert neue Widersprüche idempotent. Niemals throw.
 */
export async function detectAndPersistConflicts(
  admin: any,
  args: {
    user_id: string;
    project_id: string;
    canonical_fact_id: string;
    fact_type: string;
    content: any;
    log: Logger;
  },
): Promise<DetectedConflict[]> {
  const { user_id, project_id, canonical_fact_id, fact_type, content, log } = args;
  if (fact_type !== "deadline" && fact_type !== "decision") return [];

  try {
    const { data: rows, error } = await admin
      .from("canonical_facts")
      .select("id, fact_type, content")
      .eq("project_id", project_id)
      .eq("fact_type", fact_type);
    if (error) {
      log.warn("conflict.read_failed", "could not load canonical_facts", { error: error.message });
      return [];
    }
    const others = (rows ?? []) as Row[];
    const detected = detectConflictsPure(
      { id: canonical_fact_id, fact_type, content },
      others,
    );
    if (detected.length === 0) return [];

    // Idempotenz: existierende Paare ausfiltern.
    const { data: existing } = await admin
      .from("contradictions")
      .select("fact_a_id, fact_b_id, contradiction_type")
      .eq("project_id", project_id);
    const seen = new Set(
      (existing ?? []).map((r: any) =>
        [r.contradiction_type, ...[r.fact_a_id, r.fact_b_id].sort()].join("|")
      ),
    );

    const toInsert = detected
      .filter((d) => !seen.has([d.type, ...[d.fact_a_id, d.fact_b_id].sort()].join("|")))
      .map((d) => ({
        user_id,
        project_id,
        contradiction_type: d.type,
        fact_a_id: d.fact_a_id,
        fact_b_id: d.fact_b_id,
        description: d.description,
        resolved: false,
      }));

    if (toInsert.length === 0) return detected;

    const { error: insErr } = await admin.from("contradictions").insert(toInsert);
    if (insErr) {
      log.warn("conflict.insert_failed", "contradictions insert failed", { error: insErr.message });
      return detected;
    }
    log.stage("conflict.detected", "contradictions written", {
      count: toInsert.length,
      types: toInsert.map((r) => r.contradiction_type),
    });
    return detected;
  } catch (e) {
    log.warn("conflict.detector_threw", "unexpected error", { error: e instanceof Error ? e.message : String(e) });
    return [];
  }
}
