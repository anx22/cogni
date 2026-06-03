// =============================================================================
//  Entity-Core — Ausdrucks-Ableitung (rein, tabellengetrieben).
//  (state, mode) → ExpressionVM. Palette ergänzt der Hook zur Laufzeit.
// =============================================================================

import type {
  EntityState,
  ExpressionTone,
  ExpressionVM,
  Intensity,
  InteractionMode,
  MotionSignature,
} from "./types";

const STATE_SIGNATURE: Record<EntityState, MotionSignature> = {
  idle: "pulse",
  hover: "pulse",
  processing: "rotate",
  "review-ready": "burst",
  failed: "tremor",
  "busy-blocked": "dim",
};

const MODE_SIGNATURE: Partial<Record<InteractionMode, MotionSignature>> = {
  "compose:voice": "listen",
  "compose:note": "focus",
  "compose:link": "scan",
  "compose:file": "intake",
};

// Single-Source-Map: ruhig außen (subtle), lebendig beim Tun (strong).
const INTENSITY: Record<MotionSignature, Intensity> = {
  pulse: "subtle",
  dim: "subtle",
  focus: "subtle",
  rotate: "medium",
  burst: "strong",
  tremor: "strong",
  listen: "strong",
  scan: "strong",
  intake: "strong",
};

function isComposing(mode: InteractionMode): boolean {
  return mode.startsWith("compose:");
}

function toneFor(state: EntityState, activeCompose: boolean): ExpressionTone {
  if (state === "failed") return "alert";
  if (state === "review-ready") return "ready";
  if (state === "processing") return "working";
  if (activeCompose) return "working";
  return "default";
}

/**
 * Zwei-Achsen-Komposition: Der Lifecycle-State liefert die Basis-Signatur. Nur
 * solange das System ruhig ist (idle/hover) UND der User komponiert, übernimmt
 * die Modus-Signatur. processing/failed/review-ready/busy-blocked dominieren.
 */
export function deriveExpression(state: EntityState, mode: InteractionMode): ExpressionVM {
  const calm = state === "idle" || state === "hover";
  const activeCompose = isComposing(mode) && calm;
  const signature: MotionSignature = activeCompose
    ? (MODE_SIGNATURE[mode] as MotionSignature)
    : STATE_SIGNATURE[state];

  return {
    state,
    mode,
    signature,
    intensity: INTENSITY[signature],
    tone: toneFor(state, activeCompose),
  };
}
