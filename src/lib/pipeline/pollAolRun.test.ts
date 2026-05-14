// =============================================================================
//  pollAolRun.test.ts
// -----------------------------------------------------------------------------
//  Deckt die vier kritischen Pfade des Pollers ab:
//    1. completed  — Run erreicht terminalen Erfolgsstatus
//    2. failed     — Run schlägt fehl (terminal)
//    3. timeout    — Endzustand wird nie erreicht
//    4. abort      — externer AbortSignal stoppt den Loop
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type Snap = {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  current_node: string | null;
  error: { message?: string } | null;
  started_at: string | null;
  ended_at: string | null;
  metadata: Record<string, unknown> | null;
};

let snapshots: Snap[] = [];
let snapshotIndex = 0;

vi.mock("@/integrations/supabase/client", () => {
  const single = () =>
    Promise.resolve({
      data: snapshots[Math.min(snapshotIndex++, snapshots.length - 1)] ?? null,
      error: null,
    });
  const builder = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    maybeSingle: single,
  };
  return {
    supabase: {
      from: () => builder,
    },
  };
});

vi.mock("@/lib/devlog/devlog", () => ({
  devlog: { edge: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { pollAolRun } from "./pollAolRun";

const mkSnap = (status: Snap["status"], node: string | null = null): Snap => ({
  id: "run-1",
  status,
  current_node: node,
  error: status === "failed" ? { message: "boom" } : null,
  started_at: "2026-01-01T00:00:00Z",
  ended_at: status === "completed" || status === "failed" ? "2026-01-01T00:00:01Z" : null,
  metadata: null,
});

describe("pollAolRun", () => {
  beforeEach(() => {
    snapshots = [];
    snapshotIndex = 0;
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("löst auf, sobald Status completed ist", async () => {
    snapshots = [mkSnap("running", "parse"), mkSnap("completed", "done")];
    const onUpdate = vi.fn();
    const promise = pollAolRun("run-1", { intervalMs: 10, timeoutMs: 5000, onUpdate });
    await vi.advanceTimersByTimeAsync(50);
    const res = await promise;
    expect(res.status).toBe("completed");
    expect(res.snapshot?.status).toBe("completed");
    expect(onUpdate).toHaveBeenCalled();
  });

  it("löst auf, wenn Run failed", async () => {
    snapshots = [mkSnap("failed")];
    const promise = pollAolRun("run-1", { intervalMs: 10, timeoutMs: 5000 });
    await vi.advanceTimersByTimeAsync(50);
    const res = await promise;
    expect(res.status).toBe("failed");
    expect(res.snapshot?.error?.message).toBe("boom");
  });

  it("liefert timeout, wenn kein Endzustand erreicht wird", async () => {
    snapshots = [mkSnap("running"), mkSnap("running"), mkSnap("running")];
    const promise = pollAolRun("run-1", { intervalMs: 50, timeoutMs: 120 });
    await vi.advanceTimersByTimeAsync(500);
    const res = await promise;
    expect(res.status).toBe("timeout");
  });

  it("respektiert AbortSignal", async () => {
    snapshots = [mkSnap("running"), mkSnap("running")];
    const ctrl = new AbortController();
    const promise = pollAolRun("run-1", { intervalMs: 30, timeoutMs: 5000, signal: ctrl.signal });
    ctrl.abort();
    await vi.advanceTimersByTimeAsync(60);
    const res = await promise;
    expect(res.status).toBe("aborted");
  });
});
