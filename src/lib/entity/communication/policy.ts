// =============================================================================
//  Entity-Core — Kommunikations-Policy (rein).
//  Priorität, Rate-Limit/Anzeigedauer, Chattiness-Gating.
// =============================================================================

import type { Chattiness, UtterancePriority } from "./types";

/** Mindest-Anzeigedauer je Satz (Anti-Flicker). */
export const MIN_DISPLAY_MS = 1500;
/** „ready"-Sätze räumen sich nach dieser Zeit selbst ab. */
export const READY_CLEAR_MS = 8000;

/** Rang für Coalesce: höher schlägt niedriger. */
export const PRIORITY_RANK: Record<UtterancePriority, number> = {
  alert: 3,
  ready: 2,
  working: 1,
  ambient: 0,
};

/** true, wenn `a` mindestens so wichtig ist wie `b`. */
export function outranks(a: UtterancePriority, b: UtterancePriority): boolean {
  return PRIORITY_RANK[a] >= PRIORITY_RANK[b];
}

/**
 * Chattiness-Gating: entscheidet, ob eine Priorität bei gegebener Gesprächigkeit
 * überhaupt gesprochen wird.
 *  - quiet:    nur alert + ready (das Nötigste)
 *  - balanced: alert + ready + working (kein ambient-Rauschen)  ← Default
 *  - chatty:   alles
 */
export function passesChattiness(priority: UtterancePriority, chattiness: Chattiness): boolean {
  switch (chattiness) {
    case "quiet":
      return priority === "alert" || priority === "ready";
    case "balanced":
      return priority !== "ambient";
    case "chatty":
      return true;
    default:
      return true;
  }
}
