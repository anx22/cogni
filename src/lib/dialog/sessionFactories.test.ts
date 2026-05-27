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
    const factRef = (inhalt: string) => ({
      inhalt,
      datum: "14.05.2026",
      quelle: "Direktquelle",
      mode: "direkt" as const,
    });
    const s = buildKonfliktSession({
      id: "k1",
      title: "Termin",
      beschreibung: "x",
      faktA: factRef("Mo"),
      faktB: factRef("Di"),
      empfehlung: { gewinner: "A", begruendung: "Neuer.", konfidenz: 0.8, tier: 1 },
    });
    expect(s.boxes).toHaveLength(1);
    expect(s.boxes[0].type).toBe("konflikt");
    // Payload enthält inhalt-Strings für den Renderer
    expect(s.boxes[0].payload.faktA).toBe("Mo");
    expect(s.boxes[0].payload.faktB).toBe("Di");
    // SourceA trägt empfehlung-Hint
    expect((s.boxes[0].payload.sourceA as { recommend: boolean }).recommend).toBe(true);
    expect(s.anlass).toBe("Widerspruch klären");
    expect(s.context).toBe("Termin");
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

  it("buildHandlungsbedarfSession setzt __submitIntent mit projectId + sourceRef", () => {
    const s = buildHandlungsbedarfSession(
      { id: "h2", titel: "Frist klären", beschreibung: "...", quelle: "Mail #99" },
      "proj-uuid",
    );
    const intent = s.boxes[1].payload.__submitIntent;
    expect(intent.kind).toBe("intake_note");
    expect(intent.projectId).toBe("proj-uuid");
    expect(intent.sourceRef.id).toBe("h2");
    expect(intent.contextHint).toContain("Frist klären");
  });

  it("buildFeedbackSession setzt __submitIntent für intake_note", () => {
    const s = buildFeedbackSession("HomePrompt", "proj-x");
    const intent = s.boxes[0].payload.__submitIntent;
    expect(intent.kind).toBe("intake_note");
    expect(intent.projectId).toBe("proj-x");
    expect(intent.contextHint).toContain("HomePrompt");
  });

  it("buildFeedbackSession liefert nur Eingabe-Box", () => {
    const s = buildFeedbackSession("Projekt X");
    expect(s.boxes).toHaveLength(1);
    expect(s.boxes[0].type).toBe("eingabe");
    expect(s.anlass).toBe("Hinweis");
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
    expect(s.anlass).toBe("Themen zusammenführen");
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

  it("buildThemaMergeSession mit merge-Param setzt __submitIntent.kind=topic_merge auf aktion-Box", () => {
    const s = buildThemaMergeSession({
      titelA: "Logistik",
      beschreibungA: "...",
      titelB: "Lieferkette",
      beschreibungB: "...",
      merge: {
        candidateId: "cand-99",
        sourceTopicId: "topic-src",
        targetTopicId: "topic-tgt",
      },
    });
    const aktionBox = s.boxes.find((b) => b.type === "aktion");
    expect(aktionBox).toBeDefined();
    const intent = aktionBox!.payload.__submitIntent;
    expect(intent.kind).toBe("topic_merge");
    expect(intent.candidateId).toBe("cand-99");
    expect(intent.sourceTopicId).toBe("topic-src");
    expect(intent.targetTopicId).toBe("topic-tgt");
  });

  it("buildThemaMergeSession ohne merge-Param hat kein __submitIntent", () => {
    const s = buildThemaMergeSession({
      titelA: "A",
      beschreibungA: "...",
      titelB: "B",
      beschreibungB: "...",
    });
    const aktionBox = s.boxes.find((b) => b.type === "aktion");
    expect(aktionBox!.payload.__submitIntent).toBeUndefined();
  });
});
