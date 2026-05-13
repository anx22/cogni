// =============================================================================
//  orbPresets — State → Range-basierte Farb-/Speed-Profile.
//  Jeder State definiert ein Spektrum (kein Punkt) — beim Sampling
//  entsteht ein leicht zufälliger, lebendiger Look. OKLCH-Farbraum.
// =============================================================================

export type EntityState =
  | "idle"
  | "hover"
  | "processing"
  | "review-ready"
  | "failed"
  | "busy-blocked";

export interface Range {
  min: number;
  max: number;
}
export interface ColorRange {
  l: Range; // Lightness % (0–100)
  c: Range; // Chroma 0–0.4
  h: Range; // Hue 0–360
}
export interface OrbPresetRange {
  bg: ColorRange;
  c1: ColorRange;
  c2: ColorRange;
  c3: ColorRange;
  duration: Range; // seconds
}
export interface SampledPreset {
  colors: { bg: string; c1: string; c2: string; c3: string };
  duration: number;
}

export const rand = (r: Range): number => r.min + Math.random() * (r.max - r.min);

export const oklch = (l: number, c: number, h: number): string =>
  `oklch(${l.toFixed(2)}% ${c.toFixed(3)} ${h.toFixed(1)})`;

export function sampleColor(cr: ColorRange): string {
  return oklch(rand(cr.l), rand(cr.c), rand(cr.h));
}

export function samplePreset(p: OrbPresetRange): SampledPreset {
  return {
    colors: {
      bg: sampleColor(p.bg),
      c1: sampleColor(p.c1),
      c2: sampleColor(p.c2),
      c3: sampleColor(p.c3),
    },
    duration: rand(p.duration),
  };
}

export const ORB_PRESETS: Record<EntityState, OrbPresetRange> = {
  // Ruhig, kühl, leicht atmend.
  idle: {
    bg: { l: { min: 16, max: 20 }, c: { min: 0.015, max: 0.03 }, h: { min: 255, max: 275 } },
    c1: { l: { min: 68, max: 78 }, c: { min: 0.08, max: 0.12 }, h: { min: 215, max: 245 } },
    c2: { l: { min: 66, max: 76 }, c: { min: 0.07, max: 0.11 }, h: { min: 270, max: 295 } },
    c3: { l: { min: 62, max: 72 }, c: { min: 0.06, max: 0.10 }, h: { min: 185, max: 215 } },
    duration: { min: 18, max: 26 },
  },
  // Aufmerksam, klarer, schneller.
  hover: {
    bg: { l: { min: 20, max: 24 }, c: { min: 0.025, max: 0.04 }, h: { min: 230, max: 250 } },
    c1: { l: { min: 78, max: 86 }, c: { min: 0.11, max: 0.16 }, h: { min: 195, max: 220 } },
    c2: { l: { min: 72, max: 80 }, c: { min: 0.10, max: 0.14 }, h: { min: 275, max: 295 } },
    c3: { l: { min: 70, max: 78 }, c: { min: 0.09, max: 0.13 }, h: { min: 190, max: 210 } },
    duration: { min: 9, max: 14 },
  },
  // Heiß, schnell, warm.
  processing: {
    bg: { l: { min: 18, max: 22 }, c: { min: 0.035, max: 0.05 }, h: { min: 35, max: 65 } },
    c1: { l: { min: 74, max: 82 }, c: { min: 0.15, max: 0.20 }, h: { min: 50, max: 75 } },
    c2: { l: { min: 66, max: 74 }, c: { min: 0.16, max: 0.21 }, h: { min: 20, max: 45 } },
    c3: { l: { min: 78, max: 86 }, c: { min: 0.13, max: 0.18 }, h: { min: 75, max: 100 } },
    duration: { min: 2.5, max: 5 },
  },
  // Klar, mintig, einladend.
  "review-ready": {
    bg: { l: { min: 18, max: 22 }, c: { min: 0.025, max: 0.04 }, h: { min: 170, max: 195 } },
    c1: { l: { min: 76, max: 84 }, c: { min: 0.12, max: 0.16 }, h: { min: 150, max: 175 } },
    c2: { l: { min: 74, max: 82 }, c: { min: 0.10, max: 0.14 }, h: { min: 185, max: 210 } },
    c3: { l: { min: 78, max: 86 }, c: { min: 0.09, max: 0.13 }, h: { min: 85, max: 105 } },
    duration: { min: 6, max: 10 },
  },
  // Gedämpft, warnend, langsam.
  failed: {
    bg: { l: { min: 13, max: 17 }, c: { min: 0.015, max: 0.03 }, h: { min: 15, max: 30 } },
    c1: { l: { min: 56, max: 64 }, c: { min: 0.12, max: 0.16 }, h: { min: 18, max: 32 } },
    c2: { l: { min: 32, max: 40 }, c: { min: 0.015, max: 0.03 }, h: { min: 240, max: 260 } },
    c3: { l: { min: 36, max: 44 }, c: { min: 0.02, max: 0.04 }, h: { min: 240, max: 260 } },
    duration: { min: 26, max: 34 },
  },
  // Müde, sehr langsam, fast monochrom.
  "busy-blocked": {
    bg: { l: { min: 14, max: 18 }, c: { min: 0.005, max: 0.015 }, h: { min: 255, max: 275 } },
    c1: { l: { min: 50, max: 58 }, c: { min: 0.04, max: 0.06 }, h: { min: 220, max: 240 } },
    c2: { l: { min: 46, max: 54 }, c: { min: 0.035, max: 0.05 }, h: { min: 270, max: 290 } },
    c3: { l: { min: 44, max: 52 }, c: { min: 0.03, max: 0.05 }, h: { min: 190, max: 210 } },
    duration: { min: 22, max: 30 },
  },
};
