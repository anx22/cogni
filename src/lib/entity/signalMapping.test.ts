import { describe, it, expect } from "vitest";
import { assetRowToSignal, dialogRowToSignal } from "./signalMapping";

describe("signalMapping — assetRowToSignal", () => {
  it("INSERT → intake.started mit inputType", () =>
    expect(assetRowToSignal("INSERT", { file_type: "note" })).toEqual({
      kind: "intake.started",
      inputType: "note",
    }));

  it("UPDATE processing → intake.progress", () =>
    expect(assetRowToSignal("UPDATE", { processing_status: "processing" })).toEqual({
      kind: "intake.progress",
    }));

  it("UPDATE running → intake.progress", () =>
    expect(assetRowToSignal("UPDATE", { understanding_status: "running" })).toEqual({
      kind: "intake.progress",
    }));

  it("UPDATE failed/rate_limited/payment → intake.failed{reason}", () => {
    expect(assetRowToSignal("UPDATE", { id: "a", understanding_status: "failed" })).toEqual({
      kind: "intake.failed",
      reason: "error",
      assetId: "a",
    });
    expect(assetRowToSignal("UPDATE", { understanding_status: "rate_limited" })).toMatchObject({
      kind: "intake.failed",
      reason: "rate_limited",
    });
    expect(assetRowToSignal("UPDATE", { understanding_status: "payment_required" })).toMatchObject({
      kind: "intake.failed",
      reason: "payment_required",
    });
  });

  it("UPDATE empty → intake.empty", () =>
    expect(assetRowToSignal("UPDATE", { understanding_status: "empty" })).toEqual({
      kind: "intake.empty",
    }));

  it("UPDATE review_ready → intake.done{assetId} (Bugfix: war vorher null → busy hing)", () =>
    expect(assetRowToSignal("UPDATE", { id: "a1", understanding_status: "review_ready" })).toEqual({
      kind: "intake.done",
      assetId: "a1",
    }));

  it("UPDATE processing_status completed (us pending) → null, KEIN done (Idle-Flackern vermeiden)", () =>
    expect(
      assetRowToSignal("UPDATE", {
        processing_status: "completed",
        understanding_status: "pending",
      }),
    ).toBeNull());

  it("UPDATE-Rauschen → null", () =>
    expect(assetRowToSignal("UPDATE", { understanding_status: "pending" })).toBeNull());
});

describe("signalMapping — dialogRowToSignal", () => {
  it("INSERT open+intake → review.ready", () =>
    expect(
      dialogRowToSignal("INSERT", { id: "s1", status: "open", trigger_type: "intake" }),
    ).toEqual({ kind: "review.ready", sessionId: "s1" }));

  it("INSERT non-intake → null", () =>
    expect(
      dialogRowToSignal("INSERT", { id: "s1", status: "open", trigger_type: "manual" }),
    ).toBeNull());

  it("UPDATE completed/cancelled → review.dismissed", () => {
    expect(dialogRowToSignal("UPDATE", { status: "completed" })).toEqual({
      kind: "review.dismissed",
    });
    expect(dialogRowToSignal("UPDATE", { status: "cancelled" })).toEqual({
      kind: "review.dismissed",
    });
  });

  it("UPDATE sonst → null", () =>
    expect(dialogRowToSignal("UPDATE", { status: "open" })).toBeNull());
});
