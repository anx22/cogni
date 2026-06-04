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
  OrbPalette,
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

// Semantische Akzentfarbe je Signatur. Referenz-Tones aus den Vorlagen
// (docs/entity-core.md Z. 59): idle #06b6d4 · process #8b5cf6 · speak #f59e0b ·
// listen/voice #10b981. In OKLCH, damit sie in den Orb-Farbraum passen.
const SIGNATURE_PALETTE: Record<MotionSignature, OrbPalette> = {
  pulse: { primary: "oklch(76.2% 0.100 192.1)" }, // #06b6d4 cyan (idle/hover)
  rotate: { primary: "oklch(67.8% 0.200 293.1)" }, // #8b5cf6 violett (processing)
  burst: { primary: "oklch(77.4% 0.170 80.0)" }, // #f59e0b amber (review-ready)
  tremor: { primary: "oklch(63.0% 0.200 28.0)" }, // rot (failed)
  dim: { primary: "oklch(50.0% 0.030 260.0)" }, // neutral-grau (busy-blocked)
  listen: { primary: "oklch(74.1% 0.150 163.9)" }, // #10b981 grün (compose:voice)
  focus: { primary: "oklch(74.1% 0.120 163.9)" }, // grün-soft (compose:note)
  scan: { primary: "oklch(76.2% 0.090 192.1)" }, // cyan-soft (compose:link)
  intake: { primary: "oklch(74.1% 0.140 163.9)" }, // grün-ish (compose:file)
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
    palette: SIGNATURE_PALETTE[signature],
  };
}
