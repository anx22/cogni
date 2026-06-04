import { describe, it, expect } from "vitest";
import { composeCapabilities, STANDARD_CAPABILITIES } from "./capabilities";
import type { CharacterManifest } from "./types";

describe("capabilities — composeCapabilities", () => {
  it("Siri (leeres Manifest) → ganzes Standardset, KEIN Pointer-Follow per Default", () => {
    const r = composeCapabilities({ id: "siri", label: "Siri" });
    expect(r.standard).toEqual(STANDARD_CAPABILITIES);
    // Pointer-Follow ist opt-in → Siri folgt der Maus nicht.
    expect(r.motion).not.toContain("pointer-follow");
    expect(r.motion).toEqual([]);
  });

  it("FacePill: kein Pointer-Follow, eigene Bewegungs-Erweiterungen", () => {
    const m: CharacterManifest = {
      id: "face-pill",
      label: "Face Pill",
      suppressCore: ["pointer-follow"],
      motion: ["tilt-3d", "eyes", "custom-morph"],
    };
    const r = composeCapabilities(m);
    expect(r.motion).not.toContain("pointer-follow");
    expect(r.motion).toEqual(expect.arrayContaining(["tilt-3d", "eyes", "custom-morph"]));
  });

  it("Pointer-Follow ist opt-in via manifest.motion", () => {
    const r = composeCapabilities({ id: "siri", label: "Siri", motion: ["pointer-follow"] });
    expect(r.motion).toContain("pointer-follow");
  });

  it("Standardset ist immer präsent", () => {
    const r = composeCapabilities({ id: "siri", label: "Siri", suppressCore: ["pointer-follow"] });
    expect(r.standard).toContain("input-affordance");
    expect(r.standard).toContain("a11y-shell");
  });
});
