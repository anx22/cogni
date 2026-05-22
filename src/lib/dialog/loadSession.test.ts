// =============================================================================
//  loadSession.test.ts
// -----------------------------------------------------------------------------
//  Unit tests for loadDialogSession — mocks Supabase client.
//  Covers the critical box_type branches: conflict, gap_box, assignment,
//  silent_substanz, and the generic knowledge fallback.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Supabase mock infrastructure ------------------------------------------

type MockRow = Record<string, unknown>;

// Queue per table: each entry is the data returned for one query on that table.
let tableQueues: Record<string, MockRow | MockRow[] | null> = {};

function nextFrom(table: string): unknown {
  const v = tableQueues[table];
  if (Array.isArray(v)) {
    return { data: v, error: null };
  }
  return { data: v ?? null, error: v === undefined ? { message: "not found" } : null };
}

function makeBuilder(table: string) {
  const b: Record<string, unknown> = {};
  const chain = () => b;
  b.select = chain;
  b.eq = chain;
  b.order = chain;
  b.limit = chain;
  b.filter = chain;
  b.in = chain;
  b.maybeSingle = () => Promise.resolve(nextFrom(table));
  b.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(nextFrom(table)).then(res, rej);
  return b;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => makeBuilder(table),
  },
}));

vi.mock("@/lib/dialog/boxMapping", () => ({
  dbBoxTypeToUI: (t: string) => (t === "gap_box" ? "gap" : "wissen"),
}));

vi.mock("@/lib/dialog/sessionMode", () => ({
  deriveSessionMode: (_status: string, _boxes: unknown[]) => "edit" as const,
}));

import { loadDialogSession } from "./loadSession";

// ---------------------------------------------------------------------------

beforeEach(() => {
  tableQueues = {};
});

function seedSession(overrides: Partial<MockRow> = {}): void {
  tableQueues["dialog_sessions"] = {
    id: "sess-1",
    user_id: "u1",
    summary: "Test-Session",
    trigger_type: "manual",
    status: "open",
    project_id: null,
    updated_at: "2026-05-22T00:00:00Z",
    ...overrides,
  };
}

function seedCases(cases: MockRow[]): void {
  tableQueues["review_cases"] = cases;
}

// ---------------------------------------------------------------------------

describe("loadDialogSession", () => {
  it("gibt null zurück wenn Session nicht gefunden", async () => {
    tableQueues["dialog_sessions"] = null;
    tableQueues["review_cases"] = [];
    const result = await loadDialogSession("not-found");
    expect(result).toBeNull();
  });

  it("gibt null zurück wenn dialog_sessions-Query fehlschlägt", async () => {
    // undefined table → returns error in nextFrom
    tableQueues["review_cases"] = [];
    const result = await loadDialogSession("sess-x");
    expect(result).toBeNull();
  });

  it("Wissens-Box (generic): sachverhalt aus buildFactSummary + details", async () => {
    seedSession();
    seedCases([
      {
        id: "box-1",
        box_type: "knowledge",
        box_state: "proposed",
        title: "Entscheidung",
        description: null,
        priority: 0,
        context: {
          fact_type: "decision",
          content: { decision: "PostgreSQL verwenden", rationale: "Skalierung" },
        },
      },
    ]);
    const session = await loadDialogSession("sess-1");
    expect(session).not.toBeNull();
    expect(session!.boxes).toHaveLength(1);
    const box = session!.boxes[0];
    expect(box.type).toBe("wissen");
    expect(box.payload.sachverhalt).toBe("PostgreSQL verwenden");
    expect(box.payload.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Begründung", value: "Skalierung" }),
      ]),
    );
    expect(box.payload.__reviewCaseId).toBe("box-1");
  });

  it("Konflikt-Box: faktA und faktB aus context", async () => {
    seedSession();
    seedCases([
      {
        id: "box-c",
        box_type: "conflict",
        box_state: "proposed",
        title: "Höhenkonflikt",
        description: null,
        priority: 1,
        context: {
          fact_a: "72 m",
          fact_b: "87 m",
          summary: "Widersprüchliche Bauhöhe",
        },
      },
    ]);
    const session = await loadDialogSession("sess-1");
    const box = session!.boxes[0];
    expect(box.type).toBe("konflikt");
    expect(box.payload.faktA).toBe("72 m");
    expect(box.payload.faktB).toBe("87 m");
    expect(box.payload.beschreibung).toBe("Widersprüchliche Bauhöhe");
  });

  it("Gap-Box: wirkung und betrifft aus context", async () => {
    seedSession();
    seedCases([
      {
        id: "box-g",
        box_type: "gap_box",
        box_state: "proposed",
        title: "Lücke",
        description: null,
        priority: 0,
        context: {
          wirkung: "Bauantrag blockiert",
          betrifft: "Phase 2",
          lebensdauer: "seit 3 Tagen",
        },
      },
    ]);
    const session = await loadDialogSession("sess-1");
    const box = session!.boxes[0];
    expect(box.type).toBe("gap");
    expect(box.payload.wirkung).toBe("Bauantrag blockiert");
    expect(box.payload.betrifft).toBe("Phase 2");
    expect(box.payload.lebensdauer).toBe("seit 3 Tagen");
  });

  it("Assignment-Box: lädt all_projects, setzt recommended_project_id", async () => {
    seedSession();
    seedCases([
      {
        id: "box-a",
        box_type: "assignment",
        box_state: "proposed",
        title: "Projektzuordnung",
        description: "Agent schlägt vor…",
        priority: 0,
        context: {
          assignment_mode: "auto",
          candidates: [{ project_id: "p1", name: "" }],
          suggested_new_name: null,
          asset_id: "asset-42",
        },
      },
    ]);
    tableQueues["projects"] = [
      { id: "p1", name: "Tübingen Tower", status: "active", updated_at: "2026-05-01" },
      { id: "p2", name: "Berlin Loft", status: "active", updated_at: "2026-05-02" },
    ];
    const session = await loadDialogSession("sess-1");
    const box = session!.boxes[0];
    expect(box.type).toBe("zuordnung");
    expect(box.payload.all_projects).toHaveLength(2);
    // auto mode → first candidate = recommended
    expect(box.payload.recommended_project_id).toBe("p1");
    // name enriched from allProjects
    const enriched = box.payload.candidates.find(
      (c: { project_id: string }) => c.project_id === "p1",
    );
    expect(enriched.name).toBe("Tübingen Tower");
  });

  it("silent_substanz kind → notiz-Box", async () => {
    seedSession();
    seedCases([
      {
        id: "box-s",
        box_type: "knowledge",
        box_state: "confirmed",
        title: "Still übernommen",
        description: "3 Fakten still übernommen",
        priority: 0,
        context: {
          kind: "silent_substanz",
          count: 3,
        },
      },
    ]);
    const session = await loadDialogSession("sess-1");
    const box = session!.boxes[0];
    expect(box.type).toBe("notiz");
    expect(box.payload.kind).toBe("silent_substanz");
    expect(box.payload.count).toBe(3);
  });

  it("leere review_cases → leere Boxenliste", async () => {
    seedSession();
    seedCases([]);
    const session = await loadDialogSession("sess-1");
    expect(session).not.toBeNull();
    expect(session!.boxes).toHaveLength(0);
  });

  it("DB_TO_UI_STATE: proposed → vorgeschlagen, confirmed → bestaetigt", async () => {
    seedSession();
    seedCases([
      {
        id: "b1",
        box_type: "knowledge",
        box_state: "proposed",
        title: "A",
        priority: 0,
        context: {},
      },
      {
        id: "b2",
        box_type: "knowledge",
        box_state: "confirmed",
        title: "B",
        priority: 0,
        context: {},
      },
    ]);
    const session = await loadDialogSession("sess-1");
    expect(session!.boxes[0].state).toBe("vorgeschlagen");
    expect(session!.boxes[1].state).toBe("bestaetigt");
  });

  it("Session mit project_id → projectName aus Projekt-Lookup", async () => {
    seedSession({ project_id: "p-known" });
    seedCases([]);
    tableQueues["projects"] = { id: "p-known", name: "Bekanntes Projekt" };
    const session = await loadDialogSession("sess-1");
    expect(session!.projectId).toBe("p-known");
    expect(session!.projectName).toBe("Bekanntes Projekt");
  });
});
