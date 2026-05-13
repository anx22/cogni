// =============================================================================
//  orbPresets — State → SiriOrb Farben/Geschwindigkeit.
//  Dunkles Theme, glasartig. Jeder State trägt eine eindeutige Stimmung.
// =============================================================================

export type EntityState =
  | "idle"
  | "hover"
  | "processing"
  | "review-ready"
  | "failed"
  | "busy-blocked";

export interface OrbPreset {
  colors: { bg: string; c1: string; c2: string; c3: string };
  duration: number;
}

export const ORB_PRESETS: Record<EntityState, OrbPreset> = {
  idle: {
    colors: {
      bg: "oklch(18% 0.02 264)",
      c1: "oklch(72% 0.10 230)", // kühles Pastell-Blau
      c2: "oklch(70% 0.09 280)", // Lavendel
      c3: "oklch(68% 0.08 200)", // Petrol
    },
    duration: 20,
  },
  hover: {
    colors: {
      bg: "oklch(22% 0.03 240)",
      c1: "oklch(82% 0.13 210)", // helles Cyan
      c2: "oklch(75% 0.12 285)",
      c3: "oklch(72% 0.10 200)",
    },
    duration: 12,
  },
  processing: {
    colors: {
      bg: "oklch(20% 0.04 50)",
      c1: "oklch(78% 0.17 60)",  // Amber
      c2: "oklch(70% 0.18 30)",  // Coral
      c3: "oklch(82% 0.15 85)",  // Gold
    },
    duration: 4,
  },
  "review-ready": {
    colors: {
      bg: "oklch(20% 0.03 180)",
      c1: "oklch(80% 0.14 160)", // Mint
      c2: "oklch(78% 0.12 195)", // Aqua
      c3: "oklch(82% 0.11 95)",  // Soft-Gold
    },
    duration: 8,
  },
  failed: {
    colors: {
      bg: "oklch(15% 0.02 20)",
      c1: "oklch(60% 0.14 25)",  // gedämpftes Rot
      c2: "oklch(35% 0.02 250)", // Anthrazit
      c3: "oklch(40% 0.03 250)",
    },
    duration: 30,
  },
  "busy-blocked": {
    colors: {
      bg: "oklch(16% 0.01 264)",
      c1: "oklch(55% 0.05 230)",
      c2: "oklch(50% 0.04 280)",
      c3: "oklch(48% 0.04 200)",
    },
    duration: 25,
  },
};

/** Reduziert duration leicht, wenn die Voice "arbeitet". */
export function modulateDuration(base: number, tone?: string): number {
  if (tone === "working") return Math.max(2, base * 0.45);
  if (tone === "ready") return Math.max(4, base * 0.7);
  if (tone === "alert") return Math.max(2, base * 0.5);
  return base;
}
