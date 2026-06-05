import { describe, it, expect } from "vitest";
import { deriveSessionProgress } from "./reopenEscalated";

describe("deriveSessionProgress", () => {
  it("leere Session → 0/0, in_progress (nie still completed)", () => {
    expect(deriveSessionProgress([])).toEqual({
      total: 0,
      resolved: 0,
      status: "in_progress",
    });
  });

  it("alle Boxen resolved → completed", () => {
    expect(deriveSessionProgress(["confirmed", "rejected", "escalated"])).toEqual({
      total: 3,
      resolved: 3,
      status: "completed",
    });
  });

  it("ein reaktivierter (proposed) Case → in_progress (verlässt readonly)", () => {
    // Genau der Reopen-Fall: zuvor 3/3 escalated → 1 zurück auf proposed.
    expect(deriveSessionProgress(["confirmed", "escalated", "proposed"])).toEqual({
      total: 3,
      resolved: 2,
      status: "in_progress",
    });
  });

  it("escalated zählt als resolved (Session schließt bei voll-eskaliert)", () => {
    expect(deriveSessionProgress(["escalated", "escalated"]).status).toBe("completed");
  });

  it("offene Zwischenzustände zählen nicht als resolved", () => {
    expect(deriveSessionProgress(["proposed", "expanded", "modified"])).toEqual({
      total: 3,
      resolved: 0,
      status: "in_progress",
    });
  });
});
