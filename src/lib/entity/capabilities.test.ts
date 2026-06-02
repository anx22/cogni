import { describe, it, expect } from "vitest";
import { composeCapabilities, STANDARD_CAPABILITIES } from "./capabilities";
import type { CharacterManifest } from "./types";

describe("capabilities — composeCapabilities", () => {
  it("Siri (leeres Manifest) → ganzes Standardset + Default-Pointer-Follow", () => {
    const r = composeCapabilities({ id: "siri", label: "Siri" });
    expect(r.standard).toEqual(STANDARD_CAPABILITIES);
    expect(r.motion).toContain("pointer-follow");
  });

  it("FacePill suppress't pointer-follow, ergänzt Erweiterungen", () => {
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

  it("Standardset ist immer präsent", () => {
    const r = composeCapabilities({ id: "siri", label: "Siri", suppressCore: ["pointer-follow"] });
    expect(r.standard).toContain("input-affordance");
    expect(r.standard).toContain("a11y-shell");
  });
});
