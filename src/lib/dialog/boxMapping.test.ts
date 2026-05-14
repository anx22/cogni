import { describe, it, expect } from "vitest";
import { dbBoxTypeToUI } from "./boxMapping";

describe("dbBoxTypeToUI", () => {
  it("mappt bekannte DB-Werte auf UI-Typen", () => {
    expect(dbBoxTypeToUI("knowledge")).toBe("wissen");
    expect(dbBoxTypeToUI("assignment")).toBe("zuordnung");
    expect(dbBoxTypeToUI("conflict")).toBe("konflikt");
    expect(dbBoxTypeToUI("selection")).toBe("auswahl");
    expect(dbBoxTypeToUI("input")).toBe("eingabe");
    expect(dbBoxTypeToUI("context")).toBe("kontext");
    expect(dbBoxTypeToUI("action")).toBe("aktion");
    expect(dbBoxTypeToUI("gap_box")).toBe("gap");
  });
  it("fällt auf 'wissen' zurück bei unbekanntem Wert", () => {
    // @ts-expect-error — bewusst unzulässiger Wert
    expect(dbBoxTypeToUI("???")).toBe("wissen");
  });
});
