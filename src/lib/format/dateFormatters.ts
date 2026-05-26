/**
 * Zentrale Datums-Formatierungen für die App (de-DE).
 * Single Source of Truth — keine `toLocaleDateString` außerhalb dieses Moduls.
 */

const LOCALE = "de-DE" as const;

const safe = <T>(iso: string | null | undefined, fn: (d: Date) => T, fallback: T): T => {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;
  try {
    return fn(d);
  } catch {
    return fallback;
  }
};

/** "14. Mai 2026" */
export const fmtLong = (iso: string | null | undefined, fallback = "—"): string =>
  safe(
    iso,
    (d) => d.toLocaleDateString(LOCALE, { day: "2-digit", month: "long", year: "numeric" }),
    fallback,
  );

/** "14.05.2026" */
export const fmtShort = (iso: string | null | undefined, fallback = ""): string =>
  safe(iso, (d) => d.toLocaleDateString(LOCALE), fallback);

/** "14:32" */
export const fmtTime = (iso: string | null | undefined, fallback = ""): string =>
  safe(iso, (d) => d.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" }), fallback);

/** "14.05. 14:32" — kompakter Zeitstempel für Logs/Inspector */
export const fmtDateTimeShort = (iso: string | null | undefined, fallback = ""): string =>
  safe(
    iso,
    (d) =>
      `${d.toLocaleDateString(LOCALE, { day: "2-digit", month: "2-digit" })} ${d.toLocaleTimeString(
        LOCALE,
        { hour: "2-digit", minute: "2-digit" },
      )}`,
    fallback,
  );

/** "14. Mai, 14:32" — sprechender Zeitstempel für Dialog/Overlay */
export const fmtDateTimeLong = (
  iso: string | null | undefined,
  fallback: string | null = null,
): string | null => {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString(LOCALE, {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** Alter eines ISO-Datums in Tagen (0..n). 0 wenn in der Zukunft. */
export const ageInDays = (iso: string | null | undefined): number =>
  safe(iso, (d) => Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000)), 0);

/** ms-Timestamp aus ISO-String (0 wenn ungültig). */
export const toTimestamp = (iso: string | null | undefined): number =>
  safe(iso, (d) => d.getTime(), 0);

export { formatRelative } from "./relativeTime";
