import { describe, it, expect } from "vitest";
import { deriveSessionMode } from "./sessionMode";
import type { DialogBox } from "./types";

const box = (over: Partial<DialogBox> = {}): DialogBox => ({
  id: "b",
  type: "wissen",
  state: "aufgeklappt",
  title: "t",
  payload: {},
  ...over,
});

describe("deriveSessionMode", () => {
  it("readonly bei status=completed", () => {
    expect(deriveSessionMode("completed", [box()])).toBe("readonly");
  });
  it("readonly bei status=cancelled", () => {
    expect(deriveSessionMode("cancelled", [])).toBe("readonly");
  });
  it("edit wenn entscheidbare Box noch offen", () => {
    expect(deriveSessionMode("in_progress", [box({ state: "aufgeklappt" })])).toBe("edit");
  });
  it("readonly wenn alle Entscheidungs-Boxen final sind", () => {
    const boxes = [box({ state: "bestaetigt" }), box({ state: "verworfen" })];
    expect(deriveSessionMode("in_progress", boxes)).toBe("readonly");
  });
  it("kontext-Boxen zählen nicht für readonly-Schluss", () => {
    const boxes = [box({ type: "kontext", state: "aufgeklappt" })];
    expect(deriveSessionMode("in_progress", boxes)).toBe("edit");
  });
  it("leere Boxenliste → edit", () => {
    expect(deriveSessionMode("in_progress", [])).toBe("edit");
  });
});
