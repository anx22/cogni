import { describe, expect, it } from "vitest";
import { deriveGapEmpfehlung } from "./gaps";

describe("deriveGapEmpfehlung", () => {
  it("liefert null wenn affects fehlt oder Platzhalter ist", () => {
    expect(deriveGapEmpfehlung(null, "Lage", 1)).toBeNull();
    expect(deriveGapEmpfehlung("—", "Lage", 1)).toBeNull();
  });

  it("baut Vorschlag aus affects und schreibt submit_value-Intent", () => {
    const e = deriveGapEmpfehlung("Frist Vertrag X", "Lage", 2);
    expect(e).not.toBeNull();
    expect(e!.kind).toBe("gap");
    expect(e!.vorschlag).toContain("Frist Vertrag X");
    expect(e!.intent).toBe("submit_value");
  });

  it("staffelt Konfidenz nach Alter: <3 hoch, <14 mittel, sonst niedrig", () => {
    expect(deriveGapEmpfehlung("X", null, 1)!.konfidenz).toBe("hoch");
    expect(deriveGapEmpfehlung("X", null, 5)!.konfidenz).toBe("mittel");
    expect(deriveGapEmpfehlung("X", null, 30)!.konfidenz).toBe("niedrig");
  });

  it("nimmt impact mit in die Begründung wenn vorhanden", () => {
    const e = deriveGapEmpfehlung("X", "Lage", 4);
    expect(e!.begruendung.toLowerCase()).toContain("blockiert");
  });
});
