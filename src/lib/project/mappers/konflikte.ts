/* eslint-disable @typescript-eslint/no-explicit-any */
import { mapById } from "@/lib/utils";
import type { KonfliktVM } from "../types";
import { titleFromJson } from "./humanize";

export function toKonflikte(contradictions: any[], canonical: any[]): KonfliktVM[] {
  const factById = mapById(canonical);
  return contradictions.map((c) => {
    const a = c.fact_a_id ? factById.get(c.fact_a_id) : null;
    const b = c.fact_b_id ? factById.get(c.fact_b_id) : null;
    return {
      id: c.id,
      typ: c.contradiction_type,
      title: c.description ?? "Widerspruch",
      beschreibung: c.description ?? "",
      faktA: a ? titleFromJson(a.content, "Fakt A") : "Fakt A",
      faktB: b ? titleFromJson(b.content, "Fakt B") : "Fakt B",
      status: c.resolved ? "geloest" : "offen",
    };
  });
}
