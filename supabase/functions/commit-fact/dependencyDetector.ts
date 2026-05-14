// =============================================================================
//  commit-fact / dependencyDetector — Welle B-W4 (deterministisch, fail-soft).
// -----------------------------------------------------------------------------
//  Erkennt nach jedem Canonical-Commit Abhängigkeiten zwischen Fakten im
//  selben Projekt. Heuristik bewusst eng: Trigger-Phrase + Title-Substring.
//
//  Kinds:
//    - blockiert_durch: task referenziert anderen Fakt via "blockiert von / wartet auf / depends on / blocked by / abhängig von".
//    - wartet_auf: deadline referenziert eine decision (Title-Substring in title/description).
//    - haengt_ab_von: bleibt im Kernel (reference-Typ).
//
//  Idempotenz: (source_id, target_id, dependency_type).
//  Fail-soft: nie throw.
// =============================================================================
/* eslint-disable @typescript-eslint/no-explicit-any */
// deno-lint-ignore-file no-explicit-any

import type { Logger } from "../_shared/logger.ts";

type Row = { id: string; fact_type: string; content: any };

export type DepKind = "blockiert_durch" | "wartet_auf";

export type DetectedDependency = {
  dependency_type: DepKind;
  source_id: string;
  target_id: string;
  source_type: "canonical_fact";
  target_type: "canonical_fact";
  description: string;
};

const TRIGGERS = [
  "blockiert von",
  "blockiert durch",
  "wartet auf",
  "abhängig von",
  "abhaengig von",
  "depends on",
  "blocked by",
];

function norm(s: unknown): string {
  return typeof s === "string" ? s.trim().toLowerCase().replace(/\s+/g, " ") : "";
}
function titleOf(c: any): string {
  return (typeof c?.title === "string" && c.title) ||
    (typeof c?.name === "string" && c.name) || "";
}
function textBlob(c: any): string {
  return [c?.description, c?.text, c?.note, c?.notes, c?.summary]
    .filter((v) => typeof v === "string")
    .join(" ");
}
function hasTrigger(text: string): boolean {
  return TRIGGERS.some((t) => text.includes(t));
}

/**
 * Pure: matched fresh gegen Bestand.
 */
export function detectDependenciesPure(
  fresh: Row,
  projectFacts: Row[],
): DetectedDependency[] {
  const out: DetectedDependency[] = [];
  const c = (fresh.content ?? {}) as any;

  // 1) task → blockiert_durch
  if (fresh.fact_type === "task") {
    const blob = norm(`${titleOf(c)} ${textBlob(c)}`);
    if (!hasTrigger(blob)) return out;
    for (const o of projectFacts) {
      if (o.id === fresh.id) continue;
      if (!["task", "decision", "deadline"].includes(o.fact_type)) continue;
      const ot = norm(titleOf(o.content));
      if (ot.length < 4) continue;
      if (!blob.includes(ot)) continue;
      out.push({
        dependency_type: "blockiert_durch",
        source_id: fresh.id,
        target_id: o.id,
        source_type: "canonical_fact",
        target_type: "canonical_fact",
        description: `Task „${titleOf(c) || "—"}" blockiert durch „${titleOf(o.content)}"`,
      });
    }
    return out;
  }

  // 2) deadline → wartet_auf decision
  if (fresh.fact_type === "deadline") {
    const blob = norm(`${titleOf(c)} ${textBlob(c)}`);
    if (!blob) return out;
    for (const o of projectFacts) {
      if (o.id === fresh.id) continue;
      if (o.fact_type !== "decision") continue;
      const ot = norm(titleOf(o.content));
      if (ot.length < 4) continue;
      if (!blob.includes(ot)) continue;
      out.push({
        dependency_type: "wartet_auf",
        source_id: fresh.id,
        target_id: o.id,
        source_type: "canonical_fact",
        target_type: "canonical_fact",
        description: `Deadline „${titleOf(c) || "—"}" wartet auf Entscheidung „${titleOf(o.content)}"`,
      });
    }
    return out;
  }

  return out;
}

/**
 * Side-effect: liest relevanten Bestand, ruft pure, schreibt idempotent.
 */
export async function detectAndPersistDependencies(
  admin: any,
  args: {
    user_id: string;
    project_id: string;
    canonical_fact_id: string;
    fact_type: string;
    content: any;
    log: Logger;
  },
): Promise<DetectedDependency[]> {
  const { user_id, project_id, canonical_fact_id, fact_type, content, log } = args;
  if (fact_type !== "task" && fact_type !== "deadline") return [];

  try {
    const wantedTypes =
      fact_type === "task" ? ["task", "decision", "deadline"] : ["decision"];
    const { data, error } = await admin
      .from("canonical_facts")
      .select("id, fact_type, content")
      .eq("project_id", project_id)
      .in("fact_type", wantedTypes);
    if (error) {
      log.warn("dep.read_failed", "load facts failed", { error: error.message });
      return [];
    }
    const others = (data ?? []) as Row[];
    const detected = detectDependenciesPure(
      { id: canonical_fact_id, fact_type, content },
      others,
    );
    if (detected.length === 0) return [];

    const { data: existing } = await admin
      .from("dependencies")
      .select("source_id, target_id, dependency_type")
      .eq("project_id", project_id)
      .eq("source_id", canonical_fact_id);
    const seen = new Set(
      (existing ?? []).map((r: any) =>
        `${r.source_id}|${r.target_id}|${r.dependency_type}`
      ),
    );

    const toInsert = detected
      .filter(
        (d) => !seen.has(`${d.source_id}|${d.target_id}|${d.dependency_type}`),
      )
      .map((d) => ({
        user_id,
        project_id,
        dependency_type: d.dependency_type,
        source_type: d.source_type,
        source_id: d.source_id,
        target_type: d.target_type,
        target_id: d.target_id,
        description: d.description,
        metadata: { source: "commit-fact/dependencyDetector" },
      }));

    if (toInsert.length === 0) return detected;

    const { error: insErr } = await admin.from("dependencies").insert(toInsert);
    if (insErr) {
      log.warn("dep.insert_failed", "dependencies insert failed", { error: insErr.message });
      return detected;
    }
    log.stage("dep.detected", "dependencies written", {
      count: toInsert.length,
      kinds: toInsert.map((r) => r.dependency_type),
    });
    return detected;
  } catch (e) {
    log.warn("dep.detector_threw", "unexpected error", {
      error: e instanceof Error ? e.message : String(e),
    });
    return [];
  }
}
