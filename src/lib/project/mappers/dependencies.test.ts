import { describe, expect, it } from "vitest";
import { deriveDepEmpfehlung } from "./dependencies";

describe("deriveDepEmpfehlung", () => {
  it("liefert null ohne source/target", () => {
    expect(deriveDepEmpfehlung("blockiert_durch", null, "x")).toBeNull();
    expect(deriveDepEmpfehlung("blockiert_durch", "x", null)).toBeNull();
  });

  it("liefert null bei unbekanntem Typ", () => {
    expect(deriveDepEmpfehlung("irgendwas", "A", "B")).toBeNull();
  });

  it("blockiert_durch → 'nicht mehr blockiert', niedrige Konfidenz", () => {
    const e = deriveDepEmpfehlung("blockiert_durch", "Task A", "Entscheidung B");
    expect(e).not.toBeNull();
    expect(e!.kind).toBe("dependency");
    expect(e!.vorschlag.toLowerCase()).toContain("nicht mehr blockiert");
    expect(e!.konfidenz).toBe("niedrig");
    expect(e!.intent).toBe("submit_value");
  });

  it("wartet_auf → Status prüfen, Begründung referenziert beide Seiten", () => {
    const e = deriveDepEmpfehlung("wartet_auf", "Lieferung", "Freigabe");
    expect(e).not.toBeNull();
    expect(e!.vorschlag).toContain("Freigabe");
    expect(e!.begruendung).toContain("Lieferung");
    expect(e!.begruendung).toContain("Freigabe");
  });
});
