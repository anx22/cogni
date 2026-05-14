/* eslint-disable @typescript-eslint/no-explicit-any */
// Humanize-Helpers + JSON-Picker. Pure functions.

const SUBJECT_DE: Record<string, string> = {
  stakeholder: "Stakeholder",
  deadline: "Termin",
  decision: "Entscheidung",
  task: "Aufgabe",
  open_point: "Offener Punkt",
  gap_signal: "Lücke",
  contradiction: "Widerspruch",
  dependency: "Abhängigkeit",
  fact: "Fakt",
};
const VERB_DE: Record<string, string> = {
  add: "ergänzt",
  update: "aktualisiert",
  remove: "entfernt",
  resolve: "geschlossen",
  confirm: "bestätigt",
  reject: "verworfen",
};

export const humanizeSnapshotSummary = (raw: string | undefined): string | undefined => {
  if (!raw) return undefined;
  const m = raw.match(/^Snapshot nach\s+([a-z_]+):([a-z_]+)(?::([a-z_]+))?/i);
  if (!m) return raw;
  const subj = SUBJECT_DE[m[2]] ?? m[2];
  const verb = VERB_DE[m[3] ?? ""] ?? "aktualisiert";
  return `${subj} ${verb}.`;
};

export const titleFromJson = (v: unknown, fallback = "—"): string => {
  if (!v || typeof v !== "object") return fallback;
  const o = v as Record<string, unknown>;
  for (const k of ["title", "name", "label", "summary"]) {
    if (typeof o[k] === "string" && o[k]) return o[k] as string;
  }
  return fallback;
};

export const stringFromJson = (v: unknown, key: string): string | null => {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  return typeof o[key] === "string" ? (o[key] as string) : null;
};

export const numberFromJson = (v: unknown, key: string): number | null => {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  return typeof o[key] === "number" ? (o[key] as number) : null;
};
