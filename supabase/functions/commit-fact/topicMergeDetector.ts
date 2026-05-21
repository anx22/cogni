// =============================================================================
//  commit-fact / topicMergeDetector — P1-B4 (deterministische Erkennung).
// -----------------------------------------------------------------------------
//  Läuft nach `canonical_facts.insert` mit fact_type='topic'. Lädt alle aktiven
//  Topics desselben Projekts (merged_into IS NULL) und sucht Title-Substring-
//  Treffer (Welle-B-Pattern: token-len ≥ 4, case-insensitive).
//
//  Persistiert Treffer in `topic_merge_candidates`. Idempotent über
//  (project_id, normalisiertes Paar). Fail-soft: jeder Fehler geht via
//  Logger.warn raus, niemals throw — Detektor darf den Commit-Pfad nicht
//  abbrechen.
//
//  Hinweis: der DB-Trigger `sync_topic_from_canonical_fact` erzeugt die
//  topics-Zeile bei Commit; der Detector liest sie hier zurück.
// =============================================================================
/* eslint-disable @typescript-eslint/no-explicit-any */
// deno-lint-ignore-file no-explicit-any

import type { Logger } from "../_shared/logger.ts";

const MIN_TOKEN_LEN = 4;

type TopicRow = { id: string; canonical_fact_id: string | null; name: string };

export type DetectedTopicMerge = {
  source_topic_id: string;
  target_topic_id: string;
  source_name: string;
  target_name: string;
};

function norm(s: unknown): string {
  return typeof s === "string" ? s.trim().toLowerCase() : "";
}

function tokens(s: string): string[] {
  return s
    .split(/[\s/,;:.\-_()[\]]+/u)
    .map((t) => t.trim())
    .filter((t) => t.length >= MIN_TOKEN_LEN);
}

/**
 * Pure: vergleicht den frischen Topic-Namen gegen Bestand.
 * Hit wenn (a) normalisierter Name identisch oder (b) ein Token aus dem
 * frischen Namen als Substring im Bestand-Namen vorkommt (oder umgekehrt).
 */
export function detectTopicMergesPure(fresh: TopicRow, others: TopicRow[]): DetectedTopicMerge[] {
  const out: DetectedTopicMerge[] = [];
  const freshNorm = norm(fresh.name);
  if (!freshNorm) return out;
  const freshTokens = tokens(freshNorm);

  for (const o of others) {
    if (o.id === fresh.id) continue;
    const otherNorm = norm(o.name);
    if (!otherNorm) continue;

    // (a) exakter Match
    let match = freshNorm === otherNorm;
    // (b) Token-Substring in beide Richtungen
    if (!match) {
      for (const t of freshTokens) {
        if (otherNorm.includes(t)) {
          match = true;
          break;
        }
      }
    }
    if (!match) {
      const otherTokens = tokens(otherNorm);
      for (const t of otherTokens) {
        if (freshNorm.includes(t)) {
          match = true;
          break;
        }
      }
    }

    if (match) {
      out.push({
        source_topic_id: fresh.id,
        target_topic_id: o.id,
        source_name: fresh.name,
        target_name: o.name,
      });
    }
  }
  return out;
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Side-effect: liest topics + topic_merge_candidates, inseriert neue
 * Kandidaten idempotent. Niemals throw.
 */
export async function detectAndPersistTopicMerges(
  admin: any,
  args: {
    user_id: string;
    project_id: string;
    canonical_fact_id: string;
    fact_type: string;
    log: Logger;
  },
): Promise<DetectedTopicMerge[]> {
  const { user_id, project_id, canonical_fact_id, fact_type, log } = args;
  if (fact_type !== "topic") return [];

  try {
    // 1) Frische topics-Zeile zum canonical_fact (vom Trigger angelegt).
    const { data: freshRow, error: freshErr } = await admin
      .from("topics")
      .select("id, canonical_fact_id, name")
      .eq("canonical_fact_id", canonical_fact_id)
      .is("merged_into", null)
      .maybeSingle();
    if (freshErr) {
      log.warn("topic_merge.read_fresh_failed", "could not load fresh topic", {
        error: freshErr.message,
      });
      return [];
    }
    if (!freshRow) {
      // Trigger noch nicht durch oder fact ohne project — leise raus.
      return [];
    }

    // 2) Alle anderen aktiven topics im Projekt.
    const { data: others, error: othersErr } = await admin
      .from("topics")
      .select("id, canonical_fact_id, name")
      .eq("project_id", project_id)
      .is("merged_into", null);
    if (othersErr) {
      log.warn("topic_merge.read_others_failed", "could not load topics", {
        error: othersErr.message,
      });
      return [];
    }

    const detected = detectTopicMergesPure(freshRow as TopicRow, (others ?? []) as TopicRow[]);
    if (detected.length === 0) return [];

    // 3) Idempotenz über pair_key.
    const { data: existing } = await admin
      .from("topic_merge_candidates")
      .select("pair_key")
      .eq("project_id", project_id);
    const seen = new Set((existing ?? []).map((r: any) => String(r.pair_key)));

    const toInsert = detected
      .filter((d) => !seen.has(pairKey(d.source_topic_id, d.target_topic_id)))
      .map((d) => ({
        user_id,
        project_id,
        source_topic_id: d.source_topic_id,
        target_topic_id: d.target_topic_id,
        status: "open",
      }));

    if (toInsert.length === 0) return detected;

    const { error: insErr } = await admin.from("topic_merge_candidates").insert(toInsert);
    if (insErr) {
      log.warn("topic_merge.insert_failed", "candidates insert failed", {
        error: insErr.message,
      });
      return detected;
    }
    log.stage("topic_merge.detected", "merge candidates written", {
      count: toInsert.length,
    });
    return detected;
  } catch (e) {
    log.warn("topic_merge.detector_threw", "unexpected error", {
      error: e instanceof Error ? e.message : String(e),
    });
    return [];
  }
}
