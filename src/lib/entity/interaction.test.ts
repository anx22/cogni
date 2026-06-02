import { describe, it, expect } from "vitest";
import { classifyInput, interactionForMode, reduceInteraction } from "./interaction";

describe("interaction — classifyInput (Auto-Detect-Mapping)", () => {
  it("Sprache hat Vorrang", () =>
    expect(classifyInput({ isVoice: true, hasFiles: true, isUrl: true })).toBe("voice"));
  it("Dateien → file", () => expect(classifyInput({ hasFiles: true })).toBe("file"));
  it("URL → link", () => expect(classifyInput({ isUrl: true })).toBe("link"));
  it("reiner Text → note", () => expect(classifyInput({})).toBe("note"));
});

describe("interaction — reducer", () => {
  it("open aus resting", () => expect(reduceInteraction("resting", { kind: "open" })).toBe("open"));
  it("open ist No-op wenn schon am Komponieren", () =>
    expect(reduceInteraction("compose:note", { kind: "open" })).toBe("compose:note"));
  it("pick setzt compose:mode", () =>
    expect(reduceInteraction("open", { kind: "pick", mode: "link" })).toBe("compose:link"));
  it("close/reset → resting", () => {
    expect(reduceInteraction("compose:file", { kind: "close" })).toBe("resting");
    expect(reduceInteraction("open", { kind: "reset" })).toBe("resting");
  });
  it("interactionForMode", () => expect(interactionForMode("voice")).toBe("compose:voice"));
});
