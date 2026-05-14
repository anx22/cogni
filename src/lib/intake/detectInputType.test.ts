import { describe, it, expect } from "vitest";
import { isUrl, detectFromText, detectFromDrop } from "./detectInputType";

describe("detectInputType", () => {
  describe("isUrl", () => {
    it("erkennt http/https", () => {
      expect(isUrl("https://example.com")).toBe(true);
      expect(isUrl("http://foo.bar/baz")).toBe(true);
    });
    it("erkennt www. ohne Schema", () => {
      expect(isUrl("www.example.com")).toBe(true);
    });
    it("lehnt nackten Text ab", () => {
      expect(isUrl("kein link")).toBe(false);
      expect(isUrl("foo.bar.baz")).toBe(false);
    });
    it("lehnt URLs mit Whitespace ab", () => {
      expect(isUrl("https://foo bar")).toBe(false);
    });
  });

  describe("detectFromText", () => {
    it("trimmt und liefert url payload", () => {
      const p = detectFromText("  https://lovable.dev  ");
      expect(p.type).toBe("url");
      expect(p.url).toBe("https://lovable.dev");
      expect(p.label).toBe("Link");
    });
    it("liefert text payload sonst", () => {
      const p = detectFromText("hallo welt");
      expect(p.type).toBe("text");
      expect(p.text).toBe("hallo welt");
      expect(p.label).toBe("Notiz");
    });
  });

  describe("detectFromDrop", () => {
    it("verpackt Files", () => {
      const f = new File(["x"], "a.txt");
      const p = detectFromDrop([f]);
      expect(p.type).toBe("file");
      expect(p.files).toHaveLength(1);
    });
  });
});
