import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatRelative } from "./relativeTime";

describe("formatRelative", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-14T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("leerer String bei undefined", () => {
    expect(formatRelative(undefined)).toBe("");
    expect(formatRelative("")).toBe("");
  });
  it("ungültiges Datum → leerer String", () => {
    expect(formatRelative("nicht-ein-datum")).toBe("");
  });
  it("'gerade eben' bei <1 Min", () => {
    expect(formatRelative("2026-05-14T11:59:45Z")).toBe("gerade eben");
  });
  it("Minuten-Format <60", () => {
    expect(formatRelative("2026-05-14T11:30:00Z")).toBe("vor 30 Min");
  });
  it("Stunden-Format <24h", () => {
    expect(formatRelative("2026-05-14T07:00:00Z")).toBe("vor 5 Std");
  });
  it("Tage-Format <7d (Singular)", () => {
    expect(formatRelative("2026-05-13T12:00:00Z")).toBe("vor 1 Tag");
  });
  it("Tage-Format <7d (Plural)", () => {
    expect(formatRelative("2026-05-11T12:00:00Z")).toBe("vor 3 Tagen");
  });
  it("Datum bei >7d", () => {
    expect(formatRelative("2026-04-01T12:00:00Z")).toMatch(/01\.\s*Apr/);
  });
});
