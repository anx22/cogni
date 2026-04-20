/**
 * Sanitisiert einen Dateinamen für die Verwendung als Supabase-Storage-Key.
 * - NFKD + Diakritika strippen, ß → ss
 * - nur [A-Za-z0-9._-], Rest → _
 * - Mehrfach-_ zusammenfassen
 * - Extension bleibt erhalten
 * - Fallback "file" wenn leer
 * - Länge ~120 Zeichen
 */
export function sanitizeStorageName(name: string): string {
  const lastDot = name.lastIndexOf(".");
  const hasExt = lastDot > 0 && lastDot < name.length - 1;
  const rawBase = hasExt ? name.slice(0, lastDot) : name;
  const rawExt = hasExt ? name.slice(lastDot + 1) : "";

  const clean = (s: string) =>
    s
      .replace(/ß/g, "ss")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9._-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^[._]+|[._]+$/g, "");

  let base = clean(rawBase);
  const ext = clean(rawExt);

  if (!base) base = "file";
  if (base.length > 120) base = base.slice(0, 120).replace(/[._]+$/g, "");

  return ext ? `${base}.${ext}` : base;
}
