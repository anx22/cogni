// =============================================================================
//  intake-understand/factRules.ts
// -----------------------------------------------------------------------------
//  Fact-Type-spezifische Regeln, herausgezogen aus index.ts.
//  Neue Fact-Types ergänzt man hier — kein switch-Geflecht in der Hot-Path-
//  Logik mehr.
// =============================================================================

/** Fact-Types, bei denen wir gegen bestehende canonical_facts dedupen. */
export const LINKABLE_FACT_TYPES = new Set<string>(["stakeholder", "topic"]);

/** Pro Fact-Type ein Klartext-Summarizer. Default fällt auf title/summary zurück. */
const s = (c: Record<string, unknown>, k: string): string =>
  typeof c[k] === "string" ? (c[k] as string) : "";

export const FACT_SUMMARIZERS: Record<string, (c: Record<string, unknown>) => string> = {
  stakeholder: (c) => {
    const parts = [
      s(c, "name"),
      s(c, "role") && `(${s(c, "role")})`,
      s(c, "organization"),
      s(c, "email"),
    ].filter(Boolean);
    return parts.join(" · ");
  },
  decision: (c) => s(c, "decision") || s(c, "title") || "Entscheidung",
  task: (c) => s(c, "task") || s(c, "title") || "Aufgabe",
  deadline: (c) => {
    const what = s(c, "what") || s(c, "title") || "Termin";
    const when = s(c, "when") || s(c, "due_date");
    return when ? `${what} — ${when}` : what;
  },
  topic: (c) => s(c, "topic") || s(c, "title") || "Thema",
  open_point: (c) => s(c, "title") || s(c, "question") || "Offener Punkt",
  reference: (c) => s(c, "description") || s(c, "title") || "Referenz",
};

export function summarizeFact(factType: string, c: Record<string, unknown>): string {
  const fn = FACT_SUMMARIZERS[factType];
  if (fn) return fn(c);
  return s(c, "title") || s(c, "summary") || "";
}
