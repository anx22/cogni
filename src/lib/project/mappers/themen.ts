/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ThemaItemRef, ThemaVM } from "../types";

// P1-F3: Drilldown — Mapper sammelt nicht nur Counts, sondern auch die echten
// Entscheidungen + Offene Punkte je Topic. Verknüpfung läuft über
// `decisions.canonical_fact_id === topics.canonical_fact_id` (entsprechend
// `open_points.canonical_fact_id`). Topics ohne `canonical_fact_id` haben
// einfach `items: []`.
export function toThemen(topics: any[], decisions: any[], openPoints: any[]): ThemaVM[] {
  const decisionsByCanonical = new Map<string, any[]>();
  decisions.forEach((d) => {
    if (d.canonical_fact_id) {
      const list = decisionsByCanonical.get(d.canonical_fact_id) ?? [];
      list.push(d);
      decisionsByCanonical.set(d.canonical_fact_id, list);
    }
  });
  const openByCanonical = new Map<string, any[]>();
  openPoints.forEach((o) => {
    if (o.canonical_fact_id) {
      const list = openByCanonical.get(o.canonical_fact_id) ?? [];
      list.push(o);
      openByCanonical.set(o.canonical_fact_id, list);
    }
  });
  return topics.map((t) => {
    const tDecs = t.canonical_fact_id ? (decisionsByCanonical.get(t.canonical_fact_id) ?? []) : [];
    const tOps = t.canonical_fact_id ? (openByCanonical.get(t.canonical_fact_id) ?? []) : [];
    const items: ThemaItemRef[] = [
      ...tDecs.map(
        (d): ThemaItemRef => ({
          id: d.id,
          kind: "entscheidung",
          titel: d.title ?? "Entscheidung",
          beschreibung: d.description ?? "",
          status: typeof d.status === "string" ? d.status : undefined,
        }),
      ),
      ...tOps.map(
        (o): ThemaItemRef => ({
          id: o.id,
          kind: "offener_punkt",
          titel: o.title ?? "Offener Punkt",
          beschreibung: o.description ?? "",
          status: typeof o.status === "string" ? o.status : undefined,
        }),
      ),
    ];
    return {
      id: t.id,
      name: t.name,
      beschreibung: t.description ?? "",
      entscheidungen: tDecs.length,
      offenePunkte: tOps.length,
      dokumente: 0,
      items,
    };
  });
}
