import { describe, it, expect } from "vitest";
import { outranks, passesChattiness, PRIORITY_RANK } from "./policy";

describe("priority rank + outranks", () => {
  it("alert > ready > working > ambient", () => {
    expect(PRIORITY_RANK.alert).toBeGreaterThan(PRIORITY_RANK.ready);
    expect(PRIORITY_RANK.ready).toBeGreaterThan(PRIORITY_RANK.working);
    expect(PRIORITY_RANK.working).toBeGreaterThan(PRIORITY_RANK.ambient);
  });

  it("outranks ist >= (gleiche Priorität gewinnt)", () => {
    expect(outranks("alert", "ambient")).toBe(true);
    expect(outranks("working", "working")).toBe(true);
    expect(outranks("ambient", "ready")).toBe(false);
  });
});

describe("passesChattiness", () => {
  it("quiet: nur alert + ready", () => {
    expect(passesChattiness("alert", "quiet")).toBe(true);
    expect(passesChattiness("ready", "quiet")).toBe(true);
    expect(passesChattiness("working", "quiet")).toBe(false);
    expect(passesChattiness("ambient", "quiet")).toBe(false);
  });

  it("balanced: alles außer ambient", () => {
    expect(passesChattiness("working", "balanced")).toBe(true);
    expect(passesChattiness("ready", "balanced")).toBe(true);
    expect(passesChattiness("ambient", "balanced")).toBe(false);
  });

  it("chatty: alles", () => {
    expect(passesChattiness("ambient", "chatty")).toBe(true);
    expect(passesChattiness("working", "chatty")).toBe(true);
  });
});
