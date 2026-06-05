// =============================================================================
//  Entity-Core — reine Lifecycle-State-Machine.
//  transition(state, signal) → state. Kein React, kein Timer, kein I/O.
//  Timer (empty→settle, review-auto-open) leben in useEntitySources.
// =============================================================================

import type { EntityState, EntitySignal } from "./types";

export const ENTITY_STATES: EntityState[] = [
  "idle",
  "hover",
  "processing",
  "review-ready",
  "failed",
  "busy-blocked",
];

/**
 * Regeln:
 * - `failed`/`busy-blocked` haben Vorrang vor `progress` (ein später Tick kann
 *   nicht un-failen). `failed` ist sticky bis `user.acknowledge`.
 * - `hover` ist transient und nur aus `idle` erreichbar; `drag.leave`/`drop`
 *   stellt daher immer `idle` wieder her.
 */
export function transition(state: EntityState, signal: EntitySignal): EntityState {
  switch (signal.kind) {
    case "intake.started":
    case "intake.progress":
      return state === "failed" ? "failed" : "processing";

    case "intake.failed":
      return "failed";

    case "intake.empty":
    case "intake.settle":
      return state === "failed" ? "failed" : "idle";

    case "intake.done":
      // Terminaler Erfolg eines Assets: löst NUR ein hängendes `processing`
      // nach idle. `review-ready` (Review wartet) und `failed` bleiben unberührt
      // — kein Un-Review, kein Un-Fail. (Multi-Run-Korrektheit folgt in der Queue.)
      return state === "processing" ? "idle" : state;

    case "review.ready":
      return "review-ready";

    case "review.opened":
    case "review.dismissed":
      return "idle";

    case "drag.enter":
      return state === "idle" ? "hover" : state; // ignoriert wenn busy

    case "drag.leave":
    case "drop":
      return state === "hover" ? "idle" : state;

    case "user.acknowledge":
      return state === "failed" ? "idle" : state;

    case "system.blocked":
      return "busy-blocked";

    case "system.unblocked":
      return state === "busy-blocked" ? "idle" : state;

    case "proactive":
      return state; // ändert den Lifecycle nicht

    default:
      return state;
  }
}
