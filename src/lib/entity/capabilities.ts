// =============================================================================
//  Entity-Core — Verhaltensvertrag (rein).
//  Standardset (immer da) + komponierte Motion-Fähigkeiten je Charakter.
// =============================================================================

import type {
  CharacterManifest,
  MotionCapability,
  ResolvedCapabilities,
  StandardCapability,
} from "./types";

/** Garantiertes Standardset — jeder Charakter bekommt es. */
export const STANDARD_CAPABILITIES: StandardCapability[] = [
  "state-expression",
  "input-affordance",
  "speak",
  "a11y-shell",
];

/** Bewegung, die jeder Charakter per Default bekommt (außer er opt-outet). */
export const DEFAULT_MOTION: MotionCapability[] = ["pointer-follow"];

export function composeCapabilities(manifest: CharacterManifest): ResolvedCapabilities {
  const suppress = new Set<MotionCapability>(manifest.suppressCore ?? []);
  const motion = new Set<MotionCapability>();
  for (const m of DEFAULT_MOTION) if (!suppress.has(m)) motion.add(m);
  for (const m of manifest.motion ?? []) motion.add(m);
  return {
    standard: [...STANDARD_CAPABILITIES],
    motion: [...motion],
  };
}
