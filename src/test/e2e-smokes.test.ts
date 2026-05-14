// =============================================================================
//  E2E-Smokes — Phase 3, Pfad 1–3
// -----------------------------------------------------------------------------
//  Vollständige React-Komponenten-E2Es mit MSW würden eine eigene Test-Lane
//  rechtfertigen. Stattdessen prüfen wir hier die drei kritischen
//  Frontend-Hook-Pfade gegen einen gemockten Supabase-Client. Damit ist
//  garantiert: die Hooks rufen die richtigen Edge Functions / Tabellen mit
//  den richtigen Payloads auf — die Server-Pfade selbst sind via Deno-Tests
//  abgedeckt (commit-fact, aol-callback, ...).
//
//    Pfad 1: Note → assets.insert + intake-trigger.invoke
//    Pfad 2: Asset löschen → asset-delete.invoke
//    Pfad 3: Fakt zurückziehen → canonical_facts.update + change_events.insert
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// --- Supabase-Mock ---------------------------------------------------------

type Recorder = {
  invokes: Array<{ name: string; body: unknown }>;
  inserts: Array<{ table: string; payload: unknown }>;
  updates: Array<{ table: string; payload: unknown; eqArgs: unknown[] }>;
  uploads: Array<{ bucket: string; path: string }>;
};

const rec: Recorder = { invokes: [], inserts: [], updates: [], uploads: [] };

vi.mock("@/integrations/supabase/client", () => {
  const builder = (table: string) => {
    const ctx: { last: string; eqArgs: unknown[] } = { last: "select", eqArgs: [] };
    const b: Record<string, (...a: unknown[]) => unknown> = {};
    b.insert = (p: unknown) => {
      rec.inserts.push({ table, payload: p });
      ctx.last = "insert";
      return b;
    };
    b.update = (p: unknown) => {
      ctx.last = "update";
      // store update payload now; eq() collects keys
      (b as { _pending?: unknown })._pending = p;
      return b;
    };
    b.select = () => b;
    b.eq = (...args: unknown[]) => {
      ctx.eqArgs.push(args);
      if (ctx.last === "update") {
        rec.updates.push({
          table,
          payload: (b as { _pending?: unknown })._pending,
          eqArgs: ctx.eqArgs.slice(),
        });
      }
      return b;
    };
    b.maybeSingle = () =>
      Promise.resolve({
        data:
          table === "canonical_facts"
            ? { id: "f1", project_id: "p1", content: { x: 1 } }
            : null,
        error: null,
      });
    b.single = () => Promise.resolve({ data: { id: "asset-1" }, error: null });
    return b;
  };
  return {
    supabase: {
      auth: {
        getUser: () => Promise.resolve({ data: { user: { id: "u1" } }, error: null }),
      },
      from: builder,
      storage: {
        from: (bucket: string) => ({
          upload: (path: string) => {
            rec.uploads.push({ bucket, path });
            return Promise.resolve({ error: null });
          },
          remove: () => Promise.resolve({ error: null }),
        }),
      },
      functions: {
        invoke: (name: string, opts?: { body?: unknown }) => {
          rec.invokes.push({ name, body: opts?.body });
          return Promise.resolve({ data: { run_id: "run-1", ok: true }, error: null });
        },
      },
    },
  };
});

vi.mock("sonner", () => ({
  toast: Object.assign(() => {}, {
    error: () => {},
    success: () => {},
    warning: () => {},
  }),
}));

vi.mock("@/lib/devlog/devlog", () => ({
  devlog: { intake: vi.fn(), edge: vi.fn(), warn: vi.fn(), error: vi.fn(), db: vi.fn(), info: vi.fn() },
}));

vi.mock("@/lib/pipeline/pollAolRun", () => ({
  pollAolRun: () => Promise.resolve({ status: "completed", snapshot: null }),
  pollAolRunByAsset: () => Promise.resolve({ status: "completed", snapshot: null }),
}));

import { useIntake } from "@/lib/intake/useIntake";
import { useAssetActions, useFactActions } from "@/lib/object-actions/useObjectActions";

beforeEach(() => {
  rec.invokes = [];
  rec.inserts = [];
  rec.updates = [];
  rec.uploads = [];
});

describe("E2E Smoke: Note → Verstehen", () => {
  it("legt Asset an und triggert intake-trigger", async () => {
    const { result } = renderHook(() => useIntake());
    await act(async () => {
      await result.current.intake({ type: "text", text: "kurze Notiz für QA" });
    });
    await waitFor(() =>
      expect(rec.invokes.find((i) => i.name === "intake-trigger")).toBeTruthy(),
    );
    const ins = rec.inserts.find((i) => i.table === "assets");
    expect(ins).toBeTruthy();
    expect((ins!.payload as { file_type: string }).file_type).toBe("note");
  });
});

describe("E2E Smoke: Asset löschen", () => {
  it("ruft asset-delete mit asset_id auf", async () => {
    const { result } = renderHook(() => useAssetActions());
    await act(async () => {
      await result.current.remove("asset-xyz");
    });
    const inv = rec.invokes.find((i) => i.name === "asset-delete");
    expect(inv).toBeTruthy();
    expect((inv!.body as { asset_id: string }).asset_id).toBe("asset-xyz");
  });
});

describe("E2E Smoke: Faktum zurückziehen", () => {
  it("setzt valid_until und schreibt change_event", async () => {
    const { result } = renderHook(() => useFactActions());
    await act(async () => {
      await result.current.retract("f1", "outdated");
    });
    const upd = rec.updates.find((u) => u.table === "canonical_facts");
    expect(upd).toBeTruthy();
    expect(typeof (upd!.payload as { valid_until: string }).valid_until).toBe("string");
    const ev = rec.inserts.find((i) => i.table === "change_events");
    expect(ev).toBeTruthy();
    expect((ev!.payload as { event_type: string }).event_type).toBe("discard");
  });
});
