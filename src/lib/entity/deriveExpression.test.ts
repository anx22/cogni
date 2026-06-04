import { describe, it, expect } from "vitest";
import { deriveExpression } from "./deriveExpression";

describe("deriveExpression — Achsen & Intensität", () => {
  it("idle → pulse/subtle/default", () => {
    const e = deriveExpression("idle", "resting");
    expect(e.signature).toBe("pulse");
    expect(e.intensity).toBe("subtle");
    expect(e.tone).toBe("default");
  });

  it("liefert eine oklch-Palette je Signatur", () => {
    expect(deriveExpression("idle", "resting").palette.primary).toContain("oklch");
    expect(deriveExpression("processing", "resting").palette.primary).toContain("oklch");
    // Modus-Signatur prägt die Palette (compose:voice → listen → grün).
    const voice = deriveExpression("idle", "compose:voice");
    expect(voice.signature).toBe("listen");
    expect(voice.palette.primary).toContain("oklch");
  });

  it("processing → rotate/medium/working", () => {
    const e = deriveExpression("processing", "resting");
    expect(e.signature).toBe("rotate");
    expect(e.intensity).toBe("medium");
    expect(e.tone).toBe("working");
  });

  it("review-ready → burst/strong/ready", () => {
    const e = deriveExpression("review-ready", "resting");
    expect(e.signature).toBe("burst");
    expect(e.intensity).toBe("strong");
    expect(e.tone).toBe("ready");
  });

  it("failed → tremor/alert", () => {
    const e = deriveExpression("failed", "resting");
    expect(e.signature).toBe("tremor");
    expect(e.tone).toBe("alert");
  });

  it("Modus-Signatur gewinnt solange ruhig", () => {
    expect(deriveExpression("idle", "compose:voice").signature).toBe("listen");
    expect(deriveExpression("hover", "compose:link").signature).toBe("scan");
    expect(deriveExpression("idle", "compose:file").signature).toBe("intake");
    expect(deriveExpression("idle", "compose:note").signature).toBe("focus");
  });

  it("Lifecycle dominiert über Modus, wenn busy", () => {
    expect(deriveExpression("processing", "compose:voice").signature).toBe("rotate");
    expect(deriveExpression("failed", "compose:note").signature).toBe("tremor");
  });
});
