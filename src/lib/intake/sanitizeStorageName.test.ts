import { describe, it, expect } from "vitest";
import { sanitizeStorageName } from "./sanitizeStorageName";

describe("sanitizeStorageName", () => {
  it("strips diacritics and replaces spaces", () => {
    expect(sanitizeStorageName("Re_ Termin Erklärfilm.msg")).toBe("Re_Termin_Erklarfilm.msg");
  });

  it("strips colons and special chars", () => {
    expect(sanitizeStorageName("Präsentation: Q3.pptx")).toBe("Prasentation_Q3.pptx");
  });

  it("falls back to 'file' for non-ASCII-only names", () => {
    expect(sanitizeStorageName("日本語.pdf")).toBe("file.pdf");
  });

  it("handles ß correctly", () => {
    expect(sanitizeStorageName("Straße.txt")).toBe("Strasse.txt");
  });
});
