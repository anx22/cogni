import { describe, it, expect } from "vitest";
import {
  buildKonfliktSession,
  buildGapSession,
  buildHandlungsbedarfSession,
  buildFeedbackSession,
  buildZuordnungSession,
  buildKorrekturSession,
  buildVersionsSession,
  buildThemaMergeSession,
  buildRueckfrageSession,
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

  it("buildZuordnungSession liefert kontext + zuordnung", () => {
    const s = buildZuordnungSession({ titel: "Mail Q1", vorschlag: "Projekt Alpha" });
    expect(s.anlass).toBe("Projektzuordnung");
    expect(s.boxes.map((b) => b.type)).toEqual(["kontext", "zuordnung"]);
    expect(s.boxes[1].payload.vorschlag).toBe("Projekt Alpha");
  });

  it("buildKorrekturSession liefert kontext + eingabe mit intent=korrektur", () => {
    const s = buildKorrekturSession({ titel: "Termin", aktuell: "15. März", quelle: "Mail #7" });
    expect(s.anlass).toBe("Korrektur");
    expect(s.boxes.map((b) => b.type)).toEqual(["kontext", "eingabe"]);
    expect(s.boxes[1].payload.intent).toBe("korrektur");
  });

  it("buildVersionsSession liefert kontext + auswahl mit optionen", () => {
    const s = buildVersionsSession({
      name: "Pitch Deck",
      versionen: [
        { label: "v1", datum: "01.04.2026" },
        { label: "v2", datum: "15.04.2026" },
      ],
      quelle: "Dokument #3",
    });
    expect(s.anlass).toBe("Dokumentversion klären");
    expect(s.boxes[1].type).toBe("auswahl");
    expect(s.boxes[1].payload.optionen).toHaveLength(2);
  });

  it("buildThemaMergeSession liefert 2 kontext + 1 aktion", () => {
    const s = buildThemaMergeSession({
      titelA: "Logistik",
      beschreibungA: "...",
      titelB: "Lieferkette",
      beschreibungB: "...",
    });
    expect(s.anlass).toBe("Thema zusammenführen");
    expect(s.boxes.map((b) => b.type)).toEqual(["kontext", "kontext", "aktion"]);
    expect(s.boxes[2].payload.aktionen).toContain("Zusammenführen");
  });

  it("buildRueckfrageSession liefert kontext + eingabe mit intent=rueckfrage", () => {
    const s = buildRueckfrageSession({ frage: "Was ist der finale Liefertermin?" });
    expect(s.anlass).toBe("Rückfrage");
    expect(s.boxes.map((b) => b.type)).toEqual(["kontext", "eingabe"]);
    expect(s.boxes[1].payload.intent).toBe("rueckfrage");
    expect(s.boxes[0].payload.auszug).toBe("Was ist der finale Liefertermin?");
  });
});
