/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ThemaVM } from "../types";

export function toThemen(topics: any[], decisions: any[], openPoints: any[]): ThemaVM[] {
  const decisionsByCanonical = new Map<string, number>();
  decisions.forEach((d) => {
    if (d.canonical_fact_id) {
      decisionsByCanonical.set(
        d.canonical_fact_id,
        (decisionsByCanonical.get(d.canonical_fact_id) ?? 0) + 1,
      );
    }
  });
  const openByCanonical = new Map<string, number>();
  openPoints.forEach((o) => {
    if (o.canonical_fact_id) {
      openByCanonical.set(o.canonical_fact_id, (openByCanonical.get(o.canonical_fact_id) ?? 0) + 1);
    }
  });
  return topics.map((t) => ({
    id: t.id,
    name: t.name,
    beschreibung: t.description ?? "",
    entscheidungen: t.canonical_fact_id ? decisionsByCanonical.get(t.canonical_fact_id) ?? 0 : 0,
    offenePunkte: t.canonical_fact_id ? openByCanonical.get(t.canonical_fact_id) ?? 0 : 0,
    dokumente: 0,
  }));
}
