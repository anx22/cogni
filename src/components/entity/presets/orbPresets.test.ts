import { describe, it, expect } from "vitest";
import {
  sampleColor,
  samplePreset,
  sampleModePalette,
  mergeModePalette,
  ORB_PRESETS_DEFAULT,
  ORB_MODE_PRESETS_DEFAULT,
  INTERACTION_MODES,
  type ColorRange,
  type ModePaletteRange,
} from "./orbPresets";

describe("orbPresets — Sampling", () => {
  it("sampleColor liegt im konfigurierten Range", () => {
    const range: ColorRange = {
      l: { min: 60, max: 80 },
      c: { min: 0.05, max: 0.15 },
      h: { min: 180, max: 220 },
    };
    for (let i = 0; i < 50; i++) {
      const col = sampleColor(range);
      const m = col.match(/oklch\(([\d.]+)% ([\d.]+) ([\d.]+)\)/);
      expect(m).not.toBeNull();
      const [, l, c, h] = m!.map(Number);
      expect(l).toBeGreaterThanOrEqual(60);
      expect(l).toBeLessThanOrEqual(80);
      expect(c).toBeGreaterThanOrEqual(0.05);
      expect(c).toBeLessThanOrEqual(0.15);
      expect(h).toBeGreaterThanOrEqual(180);
      expect(h).toBeLessThanOrEqual(220);
    }
  });

  it("samplePreset liefert vollständiges Sample (Farben/Dauer/Surface)", () => {
    const s = samplePreset(ORB_PRESETS_DEFAULT.idle);
    expect(s.colors.bg).toContain("oklch");
    expect(s.colors.c1).toContain("oklch");
    expect(s.duration).toBeGreaterThan(0);
    expect(s.surface.opacity).toBeGreaterThanOrEqual(0);
    expect(s.surface.opacity).toBeLessThanOrEqual(1);
  });
});

describe("orbPresets — Modus-Paletten", () => {
  it("ORB_MODE_PRESETS_DEFAULT deckt alle InteractionModes ab", () => {
    for (const m of INTERACTION_MODES) {
      expect(ORB_MODE_PRESETS_DEFAULT[m]).toBeDefined();
      expect(ORB_MODE_PRESETS_DEFAULT[m].primary).toBeDefined();
    }
  });

  it("sampleModePalette liegt im Range", () => {
    const palette = sampleModePalette(ORB_MODE_PRESETS_DEFAULT["compose:voice"]);
    const range = ORB_MODE_PRESETS_DEFAULT["compose:voice"].primary;
    const m = palette.primary.match(/oklch\(([\d.]+)% ([\d.]+) ([\d.]+)\)/);
    expect(m).not.toBeNull();
    const [, l] = m!.map(Number);
    expect(l).toBeGreaterThanOrEqual(range.l.min);
    expect(l).toBeLessThanOrEqual(range.l.max);
  });

  it("mergeModePalette fällt ohne Override auf Default zurück (Identität)", () => {
    const def: ModePaletteRange = {
      primary: { l: { min: 70, max: 75 }, c: { min: 0.1, max: 0.12 }, h: { min: 190, max: 195 } },
    };
    expect(mergeModePalette(def, undefined)).toBe(def);
  });

  it("mergeModePalette übernimmt Override", () => {
    const def: ModePaletteRange = {
      primary: { l: { min: 70, max: 75 }, c: { min: 0.1, max: 0.12 }, h: { min: 190, max: 195 } },
    };
    const override: ModePaletteRange = {
      primary: { l: { min: 50, max: 55 }, c: { min: 0.2, max: 0.22 }, h: { min: 160, max: 165 } },
    };
    expect(mergeModePalette(def, override).primary.l.min).toBe(50);
  });
});
