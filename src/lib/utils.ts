import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Indiziert eine Liste von Objekten mit `id` als `Map<id, item>`.
 * Doppelte IDs werden vom späteren Eintrag überschrieben.
 */
export function mapById<T extends { id: string }>(items: readonly T[] | null | undefined): Map<string, T> {
  const m = new Map<string, T>();
  if (!items) return m;
  for (const item of items) m.set(item.id, item);
  return m;
}

/**
 * Zählt Items gruppiert nach einem Schlüssel. `undefined`-Schlüssel werden ignoriert.
 */
export function countBy<T>(
  items: readonly T[] | null | undefined,
  key: (t: T) => string | null | undefined,
): Map<string, number> {
  const m = new Map<string, number>();
  if (!items) return m;
  for (const item of items) {
    const k = key(item);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}
