import { describe, it, expect } from "vitest";
import {
  buildKonfliktSession,
  buildGapSession,
  buildHandlungsbedarfSession,
  buildFeedbackSession,
} from "./sessionFactories";

describe("sessionFactories", () => {
  it("buildKonfliktSession erzeugt eine konflikt-Box mit beiden Fakten", () => {
    const s = buildKonfliktSession({
      id: "k1",
      title: "Termin",
      beschreibung: "x",
      faktA: "Mo",
      faktB: "Di",
    });
    expect(s.boxes).toHaveLength(1);
    expect(s.boxes[0].type).toBe("konflikt");
    expect(s.boxes[0].payload.faktA).toBe("Mo");
    expect(s.context).toContain("Konflikt");
  });

  it("buildGapSession erzeugt eine gap-Box", () => {
    const s = buildGapSession({
      id: "g1",
      titel: "Lücke",
      wirkung: "blockiert",
      betrifft: "Phase 2",
      lebensdauer: "kurz",
    });
    expect(s.boxes[0].type).toBe("gap");
    expect(s.boxes[0].payload.wirkung).toBe("blockiert");
  });

  it("buildHandlungsbedarfSession liefert Wissen + Eingabe", () => {
    const s = buildHandlungsbedarfSession({
      id: "h1",
      titel: "Antwort fehlt",
      beschreibung: "...",
      quelle: "Mail #42",
    });
    expect(s.boxes.map((b) => b.type)).toEqual(["wissen", "eingabe"]);
  });

  it("buildFeedbackSession liefert nur Eingabe-Box", () => {
    const s = buildFeedbackSession("Projekt X");
    expect(s.boxes).toHaveLength(1);
    expect(s.boxes[0].type).toBe("eingabe");
    expect(s.anlass).toBe("Feedback");
  });

  it("session-IDs sind eindeutig", () => {
    const s1 = buildFeedbackSession("a");
    const s2 = buildFeedbackSession("b");
    expect(s1.id).not.toBe(s2.id);
  });
});
