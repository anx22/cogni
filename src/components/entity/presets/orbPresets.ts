// =============================================================================
//  orbPresets — Range-based color/speed/surface profiles per entity state.
//  OKLCH color space, sampled per state-change so each render is slightly
//  different. Persisted globally via app_settings (namespace='orb').
// =============================================================================

import { useMemo } from "react";
import { useNamespace } from "@/lib/settings/useNamespace";
import type { InteractionMode } from "@/lib/entity";

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
  l: Range; // Lightness % 0–100
  c: Range; // Chroma 0–0.4
  h: Range; // Hue 0–360
}

export type SurfaceBlend = "normal" | "screen" | "overlay" | "soft-light";

export interface SurfaceRange {
  scale: Range; // 1.0 – 3.0 (relative to orb size)
  dotSize: Range; // px
  dotSpacing: Range; // multiplier of dotSize for tile (>=2)
  dotColor: ColorRange;
  innerHole: Range; // EXTRA clearance beyond orb edge (% of surface radius). 0 = ring starts at orb edge.
  outerFade: Range; // EXTRA reach beyond orb edge before fade-out (% of surface radius).
  opacity: Range; // 0–1
  blendMode: SurfaceBlend;
  rotationDuration: Range; // seconds; 0 = no rotation
}

export interface OrbPresetRange {
  bg: ColorRange;
  c1: ColorRange;
  c2: ColorRange;
  c3: ColorRange;
  duration: Range;
  surface: SurfaceRange;
}

export interface SampledSurface {
  scale: number;
  dotSize: number;
  dotSpacing: number;
  dotColor: string;
  innerHole: number;
  outerFade: number;
  opacity: number;
  blendMode: SurfaceBlend;
  rotationDuration: number;
}

export interface SampledPreset {
  colors: { bg: string; c1: string; c2: string; c3: string };
  duration: number;
  surface: SampledSurface;
}

// ---- Sampling --------------------------------------------------------------

export const rand = (r: Range): number => r.min + Math.random() * (r.max - r.min);

export const oklch = (l: number, c: number, h: number): string =>
  `oklch(${l.toFixed(2)}% ${c.toFixed(3)} ${h.toFixed(1)})`;

export function sampleColor(cr: ColorRange): string {
  return oklch(rand(cr.l), rand(cr.c), rand(cr.h));
}

// ---- Farb-Harmonie-Generator -----------------------------------------------
//  Reine Funktion: Basisfarbe (OKLCH) + Harmonie → drei Orb-Farben (c1/c2/c3)
//  via Hue-Rotation. Rückgabe als exakte ColorRange (min===max), direkt
//  persistierbar. Chroma wird auf ~0.16 gedeckelt (sRGB-Gamut-Schutz; OKLCH
//  würde bei zu hoher Chroma clippen). `bg` bleibt in Nutzerhand.

export type Harmony = "complementary" | "analogous" | "triadic" | "tetradic" | "monochrome";

/** Hue-Rotation, modulo-sicher (immer 0–360). */
export const rotateHue = (h: number, deg: number): number => (((h + deg) % 360) + 360) % 360;

const exactRange = (l: number, c: number, h: number): ColorRange => ({
  l: { min: l, max: l },
  c: { min: c, max: c },
  h: { min: h, max: h },
});

const HARMONY_HUE_OFFSETS: Record<Exclude<Harmony, "monochrome">, [number, number, number]> = {
  complementary: [0, 180, 180],
  analogous: [0, 30, -30],
  triadic: [0, 120, -120],
  tetradic: [90, 180, 270],
};

export function generatePalette(
  base: { l: number; c: number; h: number },
  harmony: Harmony,
): { c1: ColorRange; c2: ColorRange; c3: ColorRange } {
  const cap = (x: number) => Math.min(x, 0.16);
  const c = cap(base.c);

  if (harmony === "monochrome") {
    const lo = Math.max(0, base.l - 12);
    const hi = Math.min(100, base.l + 12);
    return {
      c1: exactRange(base.l, c, base.h),
      c2: exactRange(lo, c, base.h),
      c3: exactRange(hi, c, base.h),
    };
  }

  const [o1, o2, o3] = HARMONY_HUE_OFFSETS[harmony];
  return {
    c1: exactRange(base.l, c, rotateHue(base.h, o1)),
    c2: exactRange(base.l, c, rotateHue(base.h, o2)),
    c3: exactRange(base.l, c, rotateHue(base.h, o3)),
  };
}

export function sampleSurface(s: SurfaceRange): SampledSurface {
  return {
    scale: rand(s.scale),
    dotSize: rand(s.dotSize),
    dotSpacing: rand(s.dotSpacing),
    dotColor: sampleColor(s.dotColor),
    innerHole: rand(s.innerHole),
    outerFade: rand(s.outerFade),
    opacity: rand(s.opacity),
    blendMode: s.blendMode,
    rotationDuration: rand(s.rotationDuration),
  };
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
    surface: sampleSurface(p.surface),
  };
}

// ---- Defaults --------------------------------------------------------------

const DEFAULT_SURFACE: SurfaceRange = {
  scale: { min: 1.5, max: 1.7 },
  dotSize: { min: 1.2, max: 1.8 },
  dotSpacing: { min: 4, max: 6 },
  dotColor: {
    l: { min: 60, max: 75 },
    c: { min: 0.02, max: 0.05 },
    h: { min: 220, max: 250 },
  },
  innerHole: { min: 2, max: 5 },
  outerFade: { min: 22, max: 30 },
  opacity: { min: 0.5, max: 0.7 },
  blendMode: "screen",
  rotationDuration: { min: 0, max: 0 },
};

export const ORB_PRESETS_DEFAULT: Record<EntityState, OrbPresetRange> = {
  idle: {
    bg: { l: { min: 16, max: 20 }, c: { min: 0.015, max: 0.03 }, h: { min: 255, max: 275 } },
    c1: { l: { min: 68, max: 78 }, c: { min: 0.08, max: 0.12 }, h: { min: 215, max: 245 } },
    c2: { l: { min: 66, max: 76 }, c: { min: 0.07, max: 0.11 }, h: { min: 270, max: 295 } },
    c3: { l: { min: 62, max: 72 }, c: { min: 0.06, max: 0.1 }, h: { min: 185, max: 215 } },
    duration: { min: 18, max: 26 },
    surface: DEFAULT_SURFACE,
  },
  hover: {
    bg: { l: { min: 20, max: 24 }, c: { min: 0.025, max: 0.04 }, h: { min: 230, max: 250 } },
    c1: { l: { min: 78, max: 86 }, c: { min: 0.11, max: 0.16 }, h: { min: 195, max: 220 } },
    c2: { l: { min: 72, max: 80 }, c: { min: 0.1, max: 0.14 }, h: { min: 275, max: 295 } },
    c3: { l: { min: 70, max: 78 }, c: { min: 0.09, max: 0.13 }, h: { min: 190, max: 210 } },
    duration: { min: 9, max: 14 },
    surface: {
      ...DEFAULT_SURFACE,
      opacity: { min: 0.65, max: 0.85 },
      dotColor: {
        l: { min: 70, max: 85 },
        c: { min: 0.04, max: 0.08 },
        h: { min: 195, max: 220 },
      },
    },
  },
  processing: {
    bg: { l: { min: 18, max: 22 }, c: { min: 0.035, max: 0.05 }, h: { min: 35, max: 65 } },
    c1: { l: { min: 74, max: 82 }, c: { min: 0.15, max: 0.2 }, h: { min: 50, max: 75 } },
    c2: { l: { min: 66, max: 74 }, c: { min: 0.16, max: 0.21 }, h: { min: 20, max: 45 } },
    c3: { l: { min: 78, max: 86 }, c: { min: 0.13, max: 0.18 }, h: { min: 75, max: 100 } },
    duration: { min: 2.5, max: 5 },
    surface: {
      ...DEFAULT_SURFACE,
      opacity: { min: 0.7, max: 0.9 },
      rotationDuration: { min: 14, max: 22 },
      dotColor: {
        l: { min: 70, max: 82 },
        c: { min: 0.08, max: 0.14 },
        h: { min: 40, max: 70 },
      },
    },
  },
  "review-ready": {
    bg: { l: { min: 18, max: 22 }, c: { min: 0.025, max: 0.04 }, h: { min: 170, max: 195 } },
    c1: { l: { min: 76, max: 84 }, c: { min: 0.12, max: 0.16 }, h: { min: 150, max: 175 } },
    c2: { l: { min: 74, max: 82 }, c: { min: 0.1, max: 0.14 }, h: { min: 185, max: 210 } },
    c3: { l: { min: 78, max: 86 }, c: { min: 0.09, max: 0.13 }, h: { min: 85, max: 105 } },
    duration: { min: 6, max: 10 },
    surface: {
      ...DEFAULT_SURFACE,
      dotColor: {
        l: { min: 72, max: 82 },
        c: { min: 0.06, max: 0.1 },
        h: { min: 160, max: 185 },
      },
    },
  },
  failed: {
    bg: { l: { min: 13, max: 17 }, c: { min: 0.015, max: 0.03 }, h: { min: 15, max: 30 } },
    c1: { l: { min: 56, max: 64 }, c: { min: 0.12, max: 0.16 }, h: { min: 18, max: 32 } },
    c2: { l: { min: 32, max: 40 }, c: { min: 0.015, max: 0.03 }, h: { min: 240, max: 260 } },
    c3: { l: { min: 36, max: 44 }, c: { min: 0.02, max: 0.04 }, h: { min: 240, max: 260 } },
    duration: { min: 26, max: 34 },
    surface: {
      ...DEFAULT_SURFACE,
      opacity: { min: 0.35, max: 0.55 },
      dotColor: {
        l: { min: 45, max: 60 },
        c: { min: 0.05, max: 0.1 },
        h: { min: 15, max: 30 },
      },
    },
  },
  "busy-blocked": {
    bg: { l: { min: 14, max: 18 }, c: { min: 0.005, max: 0.015 }, h: { min: 255, max: 275 } },
    c1: { l: { min: 50, max: 58 }, c: { min: 0.04, max: 0.06 }, h: { min: 220, max: 240 } },
    c2: { l: { min: 46, max: 54 }, c: { min: 0.035, max: 0.05 }, h: { min: 270, max: 290 } },
    c3: { l: { min: 44, max: 52 }, c: { min: 0.03, max: 0.05 }, h: { min: 190, max: 210 } },
    duration: { min: 22, max: 30 },
    surface: {
      ...DEFAULT_SURFACE,
      opacity: { min: 0.3, max: 0.45 },
      dotColor: {
        l: { min: 45, max: 55 },
        c: { min: 0.01, max: 0.03 },
        h: { min: 240, max: 260 },
      },
    },
  },
};

const STATES: EntityState[] = [
  "idle",
  "hover",
  "processing",
  "review-ready",
  "failed",
  "busy-blocked",
];

const presetKey = (state: EntityState) => `preset.${state}`;

// ---- Hook ------------------------------------------------------------------

export interface OrbPresetsAPI {
  presets: Record<EntityState, OrbPresetRange>;
  loaded: boolean;
  setPreset: (state: EntityState, value: OrbPresetRange) => void;
  resetPreset: (state: EntityState) => void;
}

/** Live, DB-backed orb presets. Falls back to defaults until loaded / when key missing. */
export function useOrbPresets(): OrbPresetsAPI {
  const { values, setValue, loaded } = useNamespace<OrbPresetRange>("orb");

  const presets = useMemo(() => {
    const out = {} as Record<EntityState, OrbPresetRange>;
    for (const s of STATES) {
      const fromDb = values[presetKey(s)];
      out[s] = mergePreset(ORB_PRESETS_DEFAULT[s], fromDb);
    }
    return out;
  }, [values]);

  return {
    presets,
    loaded,
    setPreset: (state, value) => setValue(presetKey(state), value),
    resetPreset: (state) => setValue(presetKey(state), ORB_PRESETS_DEFAULT[state]),
  };
}

// Defensive merge: missing fields fall back to defaults so old DB rows keep working.
function mergePreset(def: OrbPresetRange, override: OrbPresetRange | undefined): OrbPresetRange {
  if (!override) return def;
  return {
    bg: override.bg ?? def.bg,
    c1: override.c1 ?? def.c1,
    c2: override.c2 ?? def.c2,
    c3: override.c3 ?? def.c3,
    duration: override.duration ?? def.duration,
    surface: { ...def.surface, ...(override.surface ?? {}) },
  };
}

// ---- Modus-Paletten (Achse 2) ----------------------------------------------
//  Pro InteractionMode eine semantische Akzentfarbe (OKLCH-Range, gesampelt wie
//  die State-Presets). Fundament für Phase 4+: vorerst global persistierbar
//  (Namespace "orb", Keys `preset.mode.<mode>`), noch nicht an das Visual
//  verdrahtet (Farbe kommt weiterhin aus den State-Presets).

export interface ModePaletteRange {
  primary: ColorRange;
}

export const INTERACTION_MODES: InteractionMode[] = [
  "resting",
  "open",
  "compose:note",
  "compose:link",
  "compose:file",
  "compose:voice",
];

export const ORB_MODE_PRESETS_DEFAULT: Record<InteractionMode, ModePaletteRange> = {
  resting: {
    primary: { l: { min: 74, max: 78 }, c: { min: 0.09, max: 0.11 }, h: { min: 190, max: 196 } },
  },
  open: {
    primary: { l: { min: 76, max: 80 }, c: { min: 0.1, max: 0.13 }, h: { min: 188, max: 194 } },
  },
  "compose:note": {
    primary: { l: { min: 72, max: 76 }, c: { min: 0.11, max: 0.14 }, h: { min: 160, max: 168 } },
  },
  "compose:link": {
    primary: { l: { min: 74, max: 78 }, c: { min: 0.09, max: 0.11 }, h: { min: 190, max: 196 } },
  },
  "compose:file": {
    primary: { l: { min: 72, max: 76 }, c: { min: 0.13, max: 0.16 }, h: { min: 160, max: 168 } },
  },
  "compose:voice": {
    primary: { l: { min: 72, max: 76 }, c: { min: 0.14, max: 0.16 }, h: { min: 161, max: 165 } },
  },
};

const modePresetKey = (mode: InteractionMode) => `preset.mode.${mode}`;

export interface SampledModePalette {
  primary: string;
}

export function sampleModePalette(p: ModePaletteRange): SampledModePalette {
  return { primary: sampleColor(p.primary) };
}

export interface OrbModePalettesAPI {
  palettes: Record<InteractionMode, ModePaletteRange>;
  loaded: boolean;
  setPalette: (mode: InteractionMode, value: ModePaletteRange) => void;
  resetPalette: (mode: InteractionMode) => void;
}

/** Live, DB-backed Modus-Paletten. Fällt auf Defaults zurück. */
export function useOrbModePalettePresets(): OrbModePalettesAPI {
  const { values, setValue, loaded } = useNamespace<ModePaletteRange>("orb");

  const palettes = useMemo(() => {
    const out = {} as Record<InteractionMode, ModePaletteRange>;
    for (const m of INTERACTION_MODES) {
      out[m] = mergeModePalette(ORB_MODE_PRESETS_DEFAULT[m], values[modePresetKey(m)]);
    }
    return out;
  }, [values]);

  return {
    palettes,
    loaded,
    setPalette: (mode, value) => setValue(modePresetKey(mode), value),
    resetPalette: (mode) => setValue(modePresetKey(mode), ORB_MODE_PRESETS_DEFAULT[mode]),
  };
}

export function mergeModePalette(
  def: ModePaletteRange,
  override: ModePaletteRange | undefined,
): ModePaletteRange {
  if (!override) return def;
  return { primary: override.primary ?? def.primary };
}
