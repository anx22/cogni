import { describe, it, expect } from "vitest";
import { VOCABULARY, INTENT_TONE, INTENT_PRIORITY, fillSlots, pickVariant } from "./vocabulary";

describe("vocabulary bank", () => {
  it("jeder Intent hat mindestens eine Variante", () => {
    for (const [intent, variants] of Object.entries(VOCABULARY)) {
      expect(variants.length, intent).toBeGreaterThan(0);
    }
  });

  it("Ton + Priorität sind für jeden Intent definiert", () => {
    for (const intent of Object.keys(VOCABULARY)) {
      expect(INTENT_TONE[intent as keyof typeof INTENT_TONE]).toBeDefined();
      expect(INTENT_PRIORITY[intent as keyof typeof INTENT_PRIORITY]).toBeDefined();
    }
  });
});

describe("fillSlots", () => {
  it("ersetzt bekannte Slots", () => {
    expect(fillSlots("Bereit. {n} {sache}.", { n: 3, sache: "Sachen" })).toBe("Bereit. 3 Sachen.");
  });
  it("lässt unbekannte Slots stehen", () => {
    expect(fillSlots("Hallo {name}", {})).toBe("Hallo {name}");
  });
  it("ohne Slots unverändert", () => {
    expect(fillSlots("Fester Text")).toBe("Fester Text");
  });
});

describe("pickVariant (Anti-Repeat, deterministisch)", () => {
  const variants = ["a", "b", "c"];

  it("eine Variante → immer Index 0", () => {
    expect(pickVariant(["nur das"], 5, 99)).toEqual({ index: 0, text: "nur das" });
  });

  it("leer → Index -1", () => {
    expect(pickVariant([], -1, 0)).toEqual({ index: -1, text: "" });
  });

  it("vermeidet prevIndex bei >1 Varianten", () => {
    // seed trifft genau prevIndex → muss ausweichen
    const r = pickVariant(variants, 0, 0); // start = 0 == prev → +1
    expect(r.index).not.toBe(0);
    expect(variants[r.index]).toBe(r.text);
  });

  it("ist reproduzierbar bei gleichem seed/prev", () => {
    expect(pickVariant(variants, -1, 1)).toEqual(pickVariant(variants, -1, 1));
  });

  it("seed steuert die Auswahl", () => {
    expect(pickVariant(variants, -1, 2).index).toBe(2);
  });
});
