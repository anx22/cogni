import { describe, it, expect } from "vitest";
import { transition } from "./machine";
import { entitySignal } from "./signals";

describe("entity machine — transition", () => {
  it("intake.started → processing (aus idle)", () => {
    expect(transition("idle", entitySignal.intakeStarted())).toBe("processing");
  });

  it("intake.failed hat Vorrang — progress kann nicht un-failen", () => {
    expect(transition("failed", entitySignal.intakeProgress())).toBe("failed");
    expect(transition("processing", entitySignal.intakeFailed("error"))).toBe("failed");
  });

  it("failed ist sticky bis acknowledge", () => {
    expect(transition("failed", entitySignal.intakeStarted())).toBe("failed");
    expect(transition("failed", entitySignal.intakeEmpty())).toBe("failed");
    expect(transition("failed", entitySignal.userAcknowledge())).toBe("idle");
  });

  it("hover nur aus idle; drag.leave/drop stellt idle wieder her", () => {
    expect(transition("idle", entitySignal.dragEnter())).toBe("hover");
    expect(transition("processing", entitySignal.dragEnter())).toBe("processing"); // busy → ignoriert
    expect(transition("hover", entitySignal.dragLeave())).toBe("idle");
    expect(transition("hover", entitySignal.drop())).toBe("idle");
  });

  it("review-Lifecycle", () => {
    expect(transition("processing", entitySignal.reviewReady("s1"))).toBe("review-ready");
    expect(transition("review-ready", entitySignal.reviewOpened("s1"))).toBe("idle");
    expect(transition("review-ready", entitySignal.reviewDismissed())).toBe("idle");
  });

  it("empty/settle → idle (wenn nicht failed)", () => {
    expect(transition("processing", entitySignal.intakeEmpty())).toBe("idle");
    expect(transition("processing", entitySignal.intakeSettle())).toBe("idle");
  });

  it("block / unblock", () => {
    expect(transition("idle", entitySignal.systemBlocked())).toBe("busy-blocked");
    expect(transition("busy-blocked", entitySignal.systemUnblocked())).toBe("idle");
  });

  it("proactive ändert den Lifecycle nicht", () => {
    expect(transition("idle", entitySignal.proactive("reminder"))).toBe("idle");
  });
});
