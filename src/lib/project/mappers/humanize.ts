/* eslint-disable @typescript-eslint/no-explicit-any */
// Humanize-Helpers + JSON-Picker. Pure functions.
//
// Wichtig: humanizeSnapshotSummary gibt KEINE Commit-Log-Sätze mehr zurück.
// Solche Sätze ("Termin übernommen — 11 bestätigte Erkenntnisse") sind Verlauf,
// nicht Lage. Wenn das Backend nur einen solchen Satz liefert, geben wir
// `undefined` zurück und lassen den Composer einen echten Lage-Satz bauen.

const SNAPSHOT_PATTERN = /^Snapshot nach\s+[a-z_]+:[a-z_]+/i;

export const humanizeSnapshotSummary = (raw: string | undefined): string | undefined => {
  if (!raw) return undefined;
  // Generisches Commit-Pattern → kein Lage-Text.
  if (SNAPSHOT_PATTERN.test(raw)) return undefined;
  // Heuristik für die alten "X übernommen — Projekt enthält jetzt N …"-Sätze.
  if (/übernommen.*enthält/i.test(raw)) return undefined;
  if (/^[A-Za-zÄÖÜäöü]+\s+(übernommen|verworfen|aktualisiert)\b/i.test(raw)) return undefined;
  return raw;
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
