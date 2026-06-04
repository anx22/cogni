import { describe, it, expect } from "vitest";
import { deriveUtterance } from "./utterances";
import type { UtterancePolicy } from "./types";

const balanced: UtterancePolicy = { chattiness: "balanced" };
const quiet: UtterancePolicy = { chattiness: "quiet" };
const chatty: UtterancePolicy = { chattiness: "chatty" };

describe("deriveUtterance", () => {
  it("clear → action clear", () => {
    expect(deriveUtterance({ clear: true }, balanced)).toEqual({ action: "clear" });
  });

  it("agent_reason bei review.ready schlägt Vokabular + Gating", () => {
    const r = deriveUtterance(
      { intent: "review.ready", slots: { n: 2 }, agentReason: "  Budget braucht Klärung.  " },
      quiet,
    );
    expect(r).toMatchObject({
      action: "show",
      utterance: { text: "Budget braucht Klärung.", tone: "ready" },
    });
  });

  it("review.ready ohne agent_reason füllt Slots + pluralisiert", () => {
    const one = deriveUtterance({ intent: "review.ready", slots: { n: 1 } }, balanced, { seed: 0 });
    const many = deriveUtterance({ intent: "review.ready", slots: { n: 3 } }, balanced, {
      seed: 0,
    });
    expect(one.action).toBe("show");
    if (one.action === "show") expect(one.utterance.text).toContain("1 Sache");
    if (many.action === "show") expect(many.utterance.text).toContain("3 Sachen");
  });

  it("ambient (understanding.empty) bei balanced → skip", () => {
    expect(deriveUtterance({ intent: "understanding.empty" }, balanced)).toEqual({
      action: "skip",
    });
  });

  it("ambient bei chatty → show", () => {
    const r = deriveUtterance({ intent: "understanding.empty" }, chatty, { seed: 0 });
    expect(r.action).toBe("show");
    if (r.action === "show") expect(r.utterance.tone).toBe("calm");
  });

  it("working (intake) bei quiet → skip, bei balanced → show", () => {
    expect(deriveUtterance({ intent: "intake.note" }, quiet).action).toBe("skip");
    expect(deriveUtterance({ intent: "intake.note" }, balanced).action).toBe("show");
  });

  it("alert (failed) reicht retryAssetId + Ton durch, auch quiet", () => {
    const r = deriveUtterance({ intent: "understanding.failed", retryAssetId: "a-1" }, quiet, {
      seed: 0,
    });
    expect(r).toMatchObject({
      action: "show",
      utterance: { tone: "alert", retryAssetId: "a-1" },
    });
  });

  it("Anti-Repeat: prevIndex wird gemieden", () => {
    const r = deriveUtterance({ intent: "intake.note" }, balanced, { prevIndex: 0, seed: 0 });
    expect(r.action).toBe("show");
    if (r.action === "show") expect(r.variantIndex).not.toBe(0);
  });
});
