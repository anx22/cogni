import { describe, it, expect } from "vitest";
import {
  toKonflikte,
  toGaps,
  toDependencies,
  toHandlungsbedarf,
  toVerlauf,
  toThemen,
  toDokumente,
  toStakeholder,
  buildProjectViewModel,
  humanizeSnapshotSummary,
  titleFromJson,
  type RawProjectData,
} from "@/lib/project/projectViewModel";

// Tests verwenden bewusst minimale Partials — RawProjectData ist streng typed,
// daher casten wir hier auf den View-Type. Mapper akzeptieren tolerante Inputs.
const baseProject = {
  id: "p1",
  name: "Tübingen Tower",
  status: "active",
  description: "Archviz",
  updated_at: "2026-05-14T08:00:00Z",
} as unknown as RawProjectData["project"];

const emptyRaw = (): RawProjectData =>
  ({
    project: baseProject,
    snapshot: null,
    outcome: null,
    deadlines: [],
    canonical: [],
    contradictions: [],
    gaps: [],
    deps: [],
    decisions: [],
    tasks: [],
    openPoints: [],
    feedbackRows: [],
    events: [],
    topics: [],
    assets: [],
    stakeholders: [],
  }) as RawProjectData;

describe("titleFromJson", () => {
  it("zieht title bevorzugt", () => {
    expect(titleFromJson({ title: "X", name: "Y" })).toBe("X");
  });
  it("fällt auf name zurück", () => {
    expect(titleFromJson({ name: "Y" })).toBe("Y");
  });
  it("fallback wenn kein label", () => {
    expect(titleFromJson({}, "—")).toBe("—");
  });
  it("fallback bei null", () => {
    expect(titleFromJson(null, "X")).toBe("X");
  });
});

describe("humanizeSnapshotSummary", () => {
  it("filtert Commit-Log-Sätze (Snapshot-Pattern) heraus", () => {
    expect(humanizeSnapshotSummary("Snapshot nach commit:stakeholder:add")).toBeUndefined();
    expect(humanizeSnapshotSummary("Snapshot nach commit:deadline:add")).toBeUndefined();
  });
  it("lässt freien Text durch", () => {
    expect(humanizeSnapshotSummary("Frau Hase will Pflaume statt Salbei.")).toBe(
      "Frau Hase will Pflaume statt Salbei.",
    );
  });
  it("undefined bleibt undefined", () => {
    expect(humanizeSnapshotSummary(undefined)).toBeUndefined();
  });
});

describe("toKonflikte", () => {
  it("löst Faktreferenzen auf und liefert KonfliktFactRef-Objekte", () => {
    const canonical = [
      { id: "a", content: { title: "Höhe 72m" }, created_at: "2026-05-01T00:00:00Z" },
      { id: "b", content: { title: "Höhe 87m" }, created_at: "2026-05-14T00:00:00Z" },
    ];
    const contradictions = [
      {
        id: "c1",
        contradiction_type: "version",
        description: "Gebäudehöhe",
        fact_a_id: "a",
        fact_b_id: "b",
        resolved: false,
      },
    ];
    const out = toKonflikte(contradictions, canonical);
    expect(out).toHaveLength(1);
    expect(out[0].faktA.inhalt).toBe("Höhe 72m");
    expect(out[0].faktB.inhalt).toBe("Höhe 87m");
    expect(out[0].status).toBe("offen");
    // Neuere Quelle B gewinnt (13 Tage jünger) → empfehlung.gewinner = "B", tier 1 oder 2
    expect(out[0].empfehlung?.gewinner).toBe("B");
  });
  it("handhabt fehlende Faktreferenzen", () => {
    const out = toKonflikte([{ id: "c", contradiction_type: "version", resolved: true }], []);
    expect(out[0].faktA.inhalt).toBe("Fakt A");
    expect(out[0].status).toBe("geloest");
    expect(out[0].empfehlung).toBeNull();
  });
});

describe("toGaps", () => {
  it("baut Lebensdauer-String", () => {
    const out = toGaps([
      {
        id: "g1",
        title: "Sonnenstand-Studie",
        impact: "Genehmigung verzögert",
        affects: "Bauantrag",
        detected_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
    ]);
    expect(out[0].titel).toBe("Sonnenstand-Studie");
    expect(out[0].lebensdauer).toMatch(/seit 3 Tagen offen/);
  });
});

describe("toDependencies", () => {
  it("mappt Felder 1:1", () => {
    const out = toDependencies([
      {
        id: "d1",
        dependency_type: "blockiert_durch",
        source_type: "task",
        target_type: "decision",
        description: "X",
      },
    ]);
    expect(out[0]).toMatchObject({ typ: "blockiert_durch", quelle: "task", ziel: "decision" });
  });
});

describe("toHandlungsbedarf", () => {
  it("aggregiert aus 7 Quellen, markiert Konflikte als blocker", () => {
    const out = toHandlungsbedarf({
      decisions: [
        { id: "d1", title: "Farbe wählen", status: "draft", description: "" },
        { id: "d2", title: "Bestätigt", status: "active" },
      ],
      contradictions: [{ id: "c1", description: "Höhenkonflikt" }],
      gaps: [{ id: "g1", title: "Studie fehlt", impact: "" }],
      openPoints: [{ id: "o1", title: "Klären" }],
      tasks: [
        { id: "t1", title: "T1", status: "open" },
        { id: "t2", title: "T2", status: "done" },
      ],
      feedbackRows: [{ id: "f1", content: "Daumen hoch" }],
      deps: [
        {
          id: "x1",
          source_type: "a",
          target_type: "b",
          dependency_type: "blockiert_durch",
        },
      ],
    });
    // 1 Decision (draft) + 1 Konflikt + 1 Gap + 1 OpenPoint + 1 Task + 1 Feedback + 1 Dep = 7
    expect(out).toHaveLength(7);
    expect(out.find((h) => h.objektTyp === "konflikt")?.blocker).toBe(true);
    expect(out.find((h) => h.objektTyp === "dependency")?.blocker).toBe(true);
    expect(out.find((h) => h.objektTyp === "aufgabe")?.titel).toBe("T1");
  });

  it("P1-B4: Topic-Merge-Kandidaten landen mit objektTyp=topic_merge", () => {
    const out = toHandlungsbedarf({
      decisions: [],
      contradictions: [],
      gaps: [],
      openPoints: [],
      tasks: [],
      feedbackRows: [],
      deps: [],
      topicMergeCandidates: [
        {
          id: "cand-1",
          source_topic_id: "tA",
          target_topic_id: "tB",
          source: { id: "tA", name: "Markenarchitektur", description: "Bestand" },
          target: { id: "tB", name: "Brand Architecture", description: "Neu" },
        },
      ],
    });
    expect(out).toHaveLength(1);
    const item = out[0];
    expect(item.objektTyp).toBe("topic_merge");
    expect(item.arbeitsmodus).toBe("klaeren");
    expect(item.topicMerge).toEqual({
      candidateId: "cand-1",
      sourceTopicId: "tA",
      targetTopicId: "tB",
      titelA: "Markenarchitektur",
      beschreibungA: "Bestand",
      titelB: "Brand Architecture",
      beschreibungB: "Neu",
    });
  });
});

describe("toVerlauf", () => {
  it("übersetzt event_type → delta + ereignisTyp", () => {
    const out = toVerlauf([
      { id: "e1", event_type: "confirm", new_value: { title: "X" }, created_at: "2026-05-14" },
      { id: "e2", event_type: "contradict", new_value: { title: "Y" }, created_at: "2026-05-14" },
      { id: "e3", event_type: "replace", new_value: { title: "Z" }, created_at: "2026-05-14" },
    ]);
    expect(out[0]).toMatchObject({ delta: "bestaetigt", ereignisTyp: "entscheidung" });
    expect(out[1]).toMatchObject({ delta: "widersprochen", ereignisTyp: "konflikt" });
    expect(out[2]).toMatchObject({ delta: "ersetzt", ereignisTyp: "aenderung" });
  });
});

describe("toThemen", () => {
  it("zählt Entscheidungen + offene Punkte je Topic", () => {
    const out = toThemen(
      [{ id: "t1", name: "Farbe", canonical_fact_id: "cf1", description: "" }],
      [
        { id: "d1", canonical_fact_id: "cf1", title: "Farbe A" },
        { id: "d2", canonical_fact_id: "cf1", title: "Farbe B" },
      ],
      [{ id: "o1", canonical_fact_id: "cf1", title: "Klären" }],
    );
    expect(out[0]).toMatchObject({ name: "Farbe", entscheidungen: 2, offenePunkte: 1 });
  });

  it("P1-F3: Drilldown-Items werden aufgesammelt (Decisions + OpenPoints)", () => {
    const out = toThemen(
      [{ id: "t1", name: "Farbe", canonical_fact_id: "cf1", description: "Beschr." }],
      [
        { id: "d1", canonical_fact_id: "cf1", title: "Farbe Header", status: "active" },
        { id: "d2", canonical_fact_id: "other", title: "Andere" },
      ],
      [{ id: "o1", canonical_fact_id: "cf1", title: "RAL noch offen", description: "Welche?" }],
    );
    const items = out[0].items;
    expect(items).toHaveLength(2);
    expect(items.find((i) => i.kind === "entscheidung")).toMatchObject({
      id: "d1",
      titel: "Farbe Header",
      status: "active",
    });
    expect(items.find((i) => i.kind === "offener_punkt")).toMatchObject({
      id: "o1",
      titel: "RAL noch offen",
      beschreibung: "Welche?",
    });
  });

  it("Topic ohne canonical_fact_id → items leer", () => {
    const out = toThemen(
      [{ id: "t1", name: "Verwaist", canonical_fact_id: null, description: "" }],
      [{ id: "d1", canonical_fact_id: "cf1", title: "X" }],
      [],
    );
    expect(out[0].items).toEqual([]);
  });
});

describe("toDokumente", () => {
  it("default version=1, datum formatiert", () => {
    const out = toDokumente([
      {
        id: "a1",
        file_name: "Mail.eml",
        file_type: "eml",
        metadata: {},
        created_at: "2026-05-14T00:00:00Z",
      },
    ]);
    expect(out[0]).toMatchObject({ name: "Mail.eml", typ: "eml", version: 1 });
    expect(out[0].datum).toMatch(/14\./);
  });
});

describe("toStakeholder", () => {
  it("nimmt person.name, fällt auf org.name zurück", () => {
    const out = toStakeholder([
      { id: "s1", role: "Inhaberin", persons: { name: "Frau Hase", role: "CEO" } },
      { id: "s2", role: null, persons: null, organizations: { name: "Stadt" } },
    ]);
    expect(out[0]).toMatchObject({ name: "Frau Hase", rolle: "Inhaberin" });
    expect(out[1].name).toBe("Stadt");
  });
});

describe("buildProjectViewModel — Composition", () => {
  it("liefert isEmpty=true bei leerem Projekt + Standard-Lagetext", () => {
    const { vm, isEmpty } = buildProjectViewModel(emptyRaw());
    expect(isEmpty).toBe(true);
    expect(vm.lagetext).toMatch(/Projekt ist angelegt/);
    expect(vm.stats.naechsterTermin).toBe("—");
  });

  it("baut Lagetext mit offenen Punkten wenn kein Snapshot", () => {
    const raw = emptyRaw();
    raw.canonical = [
      { id: "a", content: { title: "X" }, updated_at: "2026-05-14" },
    ] as unknown as RawProjectData["canonical"];
    raw.contradictions = [
      { id: "c1", description: "X", fact_a_id: "a", fact_b_id: null, resolved: false },
    ] as unknown as RawProjectData["contradictions"];
    raw.gaps = [
      { id: "g1", title: "G", impact: "", affects: "", detected_at: "2026-05-14" },
    ] as unknown as RawProjectData["gaps"];
    const { vm, isEmpty } = buildProjectViewModel(raw);
    expect(isEmpty).toBe(false);
    // Narrative: Projektbeschreibung + offene-Punkte-Satz (kein Graphstatus)
    expect(vm.lagetext).toMatch(/Archviz/);
    expect(vm.lagetext).toMatch(/offene/i);
    expect(vm.konflikte).toHaveLength(1);
    expect(vm.gaps).toHaveLength(1);
  });

  it("zieht nächste Deadline (zukünftig) statt vergangener", () => {
    const raw = emptyRaw();
    const future = new Date(Date.now() + 86400000).toISOString();
    raw.deadlines = [
      { id: "p", due_date: "2020-01-01", title: "vergangen" },
      { id: "f", due_date: future, title: "zukunft" },
    ] as unknown as RawProjectData["deadlines"];
    const { vm } = buildProjectViewModel(raw);
    expect(vm.stats.naechsterTermin).not.toBe("—");
  });

  it("filtert Commit-Log-Snapshot heraus und zeigt Projektbeschreibung", () => {
    const raw = emptyRaw();
    // Commit-Log-Snapshot wird gefiltert → fallbackLage greift (Projektbeschreibung)
    raw.snapshot = {
      summary: "Snapshot nach commit:deadline:add",
    } as unknown as RawProjectData["snapshot"];
    raw.canonical = [
      { id: "a", content: { title: "X" }, updated_at: "2026-05-14" },
    ] as unknown as RawProjectData["canonical"];
    const { vm } = buildProjectViewModel(raw);
    // Neue Narrative: Projektbeschreibung als Lagetext, nicht Graphzähler
    expect(vm.lagetext).toMatch(/Archviz/);
  });

  it("D7: coverage-Felder werden aus canonical + gaps + konflikte berechnet", () => {
    const raw = emptyRaw();
    raw.canonical = [
      { id: "a", content: { title: "X" }, updated_at: "2026-05-14" },
      { id: "b", content: { title: "Y" }, updated_at: "2026-05-14" },
    ] as unknown as RawProjectData["canonical"];
    raw.gaps = [
      { id: "g1", title: "G", impact: "", affects: "", detected_at: "2026-05-14" },
    ] as unknown as RawProjectData["gaps"];
    raw.contradictions = [
      { id: "c1", description: "X", fact_a_id: "a", fact_b_id: "b", resolved: false },
    ] as unknown as RawProjectData["contradictions"];
    const { vm } = buildProjectViewModel(raw);
    expect(vm.coverage.knownFacts).toBe(2);
    expect(vm.coverage.openGaps).toBe(1);
    expect(vm.coverage.conflictsActive).toBe(1);
    expect(vm.coverage.lastIntakeAge).toBeDefined();
  });

  it("D8: topicMergeCandidates fließen als topic_merge-Items in handlungsbedarf", () => {
    const raw = emptyRaw();
    raw.topicMergeCandidates = [
      {
        id: "cand-1",
        source_topic_id: "tA",
        target_topic_id: "tB",
        source: { id: "tA", name: "Alpha", description: "Desc A" },
        target: { id: "tB", name: "Beta", description: "Desc B" },
      },
    ] as unknown as RawProjectData["topicMergeCandidates"];
    const { vm } = buildProjectViewModel(raw);
    const mergeItems = vm.handlungsbedarf.filter((h) => h.objektTyp === "topic_merge");
    expect(mergeItems).toHaveLength(1);
    expect(mergeItems[0].topicMerge?.candidateId).toBe("cand-1");
    expect(mergeItems[0].topicMerge?.titelA).toBe("Alpha");
  });
});
