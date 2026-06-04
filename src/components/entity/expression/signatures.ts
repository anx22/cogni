// =============================================================================
//  Bewegungs-Signaturen — die präzise Geometrie jeder Signatur als
//  Web-Animations-API-Keyframes. Quelle: Button_Orb (uiverse hot-turkey-65),
//  va-core-* Keyframes (siehe docs/entity-core.md Z. 43–71).
//
//  Reines Daten-/Logik-Modul (kein React, kein DOM). Der SignatureLayer treibt
//  diese Specs über die WAA — bewusst NICHT über CSS-Klassen-Swap: ein
//  Klassen-Swap startet die Keyframe-Animation bei jedem Signatur-Wechsel hart
//  bei Frame 0 (sichtbarer Snap), und ein transition-basierter Handoff kann
//  deadlocken (transitionend feuert nicht, wenn Start == Ziel == identity).
//  Die WAA gibt uns promise-basierte Übergänge + commitStyles() für nahtlose,
//  butterweiche Handoffs ohne Race-Conditions.
// =============================================================================

import type { MotionSignature } from "@/lib/entity";

/** Ruhe-Pose bei prefers-reduced-motion (statisch, ohne Timeline). */
export interface ReducedPose {
  transform?: string;
  filter?: string;
}

/** Verbindliche Spec einer Signatur. */
export interface MotionSignatureSpec {
  /** WAA-Keyframes (peak-Geometrie aus den Referenz-va-*-Animationen). */
  keyframes: Keyframe[];
  /** WAA-Timing. duration in ms. */
  timing: KeyframeEffectOptions;
  /** Statische Ersatz-Pose bei reduzierter Bewegung. null = komplett ruhig. */
  reduced: ReducedPose | null;
}

const INF = Infinity;

// -----------------------------------------------------------------------------
//  Verbindliche Signatur-Tabelle. Werte 1:1 aus den lokalen Referenz-Assets.
// -----------------------------------------------------------------------------

export const MOTION_SIGNATURES: Record<MotionSignature, MotionSignatureSpec> = {
  // ── State-Signaturen ───────────────────────────────────────────────────────

  // va-core-idle 3.8s ease-in-out infinite · scale 1↔1.12 · opacity 1↔0.95
  pulse: {
    keyframes: [
      { transform: "scale(1)", opacity: 1, offset: 0, easing: "ease-in-out" },
      { transform: "scale(1.12)", opacity: 0.95, offset: 0.5, easing: "ease-in-out" },
      { transform: "scale(1)", opacity: 1, offset: 1 },
    ],
    timing: { duration: 3800, iterations: INF },
    reduced: null,
  },

  // va-core-process 1.3s · scale-Atmung + volle Umdrehung (Gestalt aus
  // mesh-spin/rings/spinner auf eine Ebene verdichtet; 0deg==360deg → nahtlos).
  rotate: {
    keyframes: [
      { transform: "scale(1) rotate(0deg)", offset: 0, easing: "ease-in-out" },
      { transform: "scale(1.15) rotate(180deg)", offset: 0.5, easing: "ease-in-out" },
      { transform: "scale(1) rotate(360deg)", offset: 1 },
    ],
    timing: { duration: 1300, iterations: INF },
    reduced: null, // unter reduced-motion komplett ruhig (Farbe trägt den State)
  },

  // va-core-speak 0.38s ease-in-out infinite alternate · scale 1→1.32
  burst: {
    keyframes: [{ transform: "scale(1)" }, { transform: "scale(1.32)" }],
    timing: { duration: 380, iterations: INF, direction: "alternate", easing: "ease-in-out" },
    reduced: null,
  },

  // Gedämpfter Shake (abgeleitet — Button_Orb hat keine Tremor-Vorlage).
  // Spielt EINMAL beim Eintritt in „failed", klingt aus und ruht (kein Dauer-
  // Buzz). Die rote Palette signalisiert den anhaltenden Fehlerzustand.
  tremor: {
    keyframes: [
      { transform: "translateX(0)", offset: 0 },
      { transform: "translateX(-5px)", offset: 0.12 },
      { transform: "translateX(5px)", offset: 0.24 },
      { transform: "translateX(-4px)", offset: 0.38 },
      { transform: "translateX(4px)", offset: 0.52 },
      { transform: "translateX(-2px)", offset: 0.68 },
      { transform: "translateX(2px)", offset: 0.82 },
      { transform: "translateX(0)", offset: 1 },
    ],
    timing: { duration: 600, iterations: 1, easing: "ease-out", fill: "forwards" },
    reduced: { filter: "brightness(0.85)" },
  },

  // Einmaliges Eindimmen + leichtes Schrumpfen, hält die Pose (busy-blocked).
  dim: {
    keyframes: [
      { transform: "scale(1)", filter: "brightness(1)", offset: 0 },
      { transform: "scale(0.96)", filter: "brightness(0.55)", offset: 1 },
    ],
    timing: { duration: 500, iterations: 1, easing: "ease-in-out", fill: "forwards" },
    reduced: { transform: "scale(0.96)", filter: "brightness(0.55)" },
  },

  // ── Modus-Signaturen ───────────────────────────────────────────────────────

  // va-core-listen 1s ease-in-out infinite · scale 1↔1.22
  listen: {
    keyframes: [
      { transform: "scale(1)", offset: 0, easing: "ease-in-out" },
      { transform: "scale(1.22)", offset: 0.5, easing: "ease-in-out" },
      { transform: "scale(1)", offset: 1 },
    ],
    timing: { duration: 1000, iterations: INF },
    reduced: null,
  },

  // Sanfte, konzentrierte Atmung (compose:note).
  focus: {
    keyframes: [
      { transform: "scale(1)", offset: 0, easing: "ease-in-out" },
      { transform: "scale(1.06)", offset: 0.5, easing: "ease-in-out" },
      { transform: "scale(1)", offset: 1 },
    ],
    timing: { duration: 2200, iterations: INF },
    reduced: null,
  },

  // Mittlere Atmung (compose:link).
  scan: {
    keyframes: [
      { transform: "scale(1)", offset: 0, easing: "ease-in-out" },
      { transform: "scale(1.1)", offset: 0.5, easing: "ease-in-out" },
      { transform: "scale(1)", offset: 1 },
    ],
    timing: { duration: 1600, iterations: INF },
    reduced: null,
  },

  // Aufsaugende Rotation (compose:file) — process-lite.
  intake: {
    keyframes: [
      { transform: "scale(1) rotate(0deg)", offset: 0, easing: "ease-in-out" },
      { transform: "scale(1.1) rotate(180deg)", offset: 0.5, easing: "ease-in-out" },
      { transform: "scale(1) rotate(360deg)", offset: 1 },
    ],
    timing: { duration: 900, iterations: INF },
    reduced: null,
  },
};

// -----------------------------------------------------------------------------
//  Übergangs-Konstanten (aus der Orb-Transition-Spec: 0.5s snap-ease).
// -----------------------------------------------------------------------------

/** Dauer des weichen Rückwegs zur Ruhe-Pose vor dem Signatur-Wechsel (ms). */
export const BRIDGE_MS = 500;
/** Snap-Ease der Orb-Transition (docs/entity-core.md Z. 52). */
export const ENTITY_EASE_SNAP = "cubic-bezier(0.34, 1.26, 0.64, 1)";

// -----------------------------------------------------------------------------
//  Auflösung (rein) — wendet reduced-motion an. Vom Hook + SignatureLayer genutzt.
// -----------------------------------------------------------------------------

export type ResolvedMotionMode = "animate" | "static" | "none";

export interface ResolvedMotion {
  mode: ResolvedMotionMode;
  /** nur bei mode === "animate" */
  keyframes?: Keyframe[];
  /** nur bei mode === "animate" */
  timing?: KeyframeEffectOptions;
  /** nur bei mode === "static" */
  staticStyle?: ReducedPose;
}

/**
 * Löst eine Signatur unter Berücksichtigung von prefers-reduced-motion auf.
 * - normal      → "animate" (volle Keyframes)
 * - reduced + reduced-Pose vorhanden → "static" (Pose ohne Timeline)
 * - reduced + reduced === null       → "none" (komplette Ruhe)
 */
export function resolveSignatureMotion(
  signature: MotionSignature,
  prefersReduced: boolean,
): ResolvedMotion {
  const spec = MOTION_SIGNATURES[signature];
  if (!prefersReduced) {
    return { mode: "animate", keyframes: spec.keyframes, timing: spec.timing };
  }
  if (spec.reduced) {
    return { mode: "static", staticStyle: spec.reduced };
  }
  return { mode: "none" };
}
