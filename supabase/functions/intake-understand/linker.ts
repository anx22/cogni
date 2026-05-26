// =============================================================================
//  intake-understand / linker — pure linking logic.
// -----------------------------------------------------------------------------
//  Welle B-W1 (2026-05-14): Linker bekommt eine optionale Graph-Evidenz-Schicht.
//  Wenn `searchHits` mitgegeben wird (z. B. via _shared/clients/graphitiSearch),
//  wird zusätzlich zum Title-Match geprüft, ob das semantische Graph-Signal
//  einen bestehenden Fakt stützt:
//    1. Exakter Title-Match (alt) → confirm.
//    2. Sonst: irgendein Hit dessen `fact`-Text die Title-Tokens als Substring
//       enthält UND ein existing-Fakt gleichen fact_type passt → confirm.
//    3. Sonst → add.
//  Ohne searchHits = exakt altes Verhalten (Backwards-compat).
// =============================================================================
// deno-lint-ignore-file no-explicit-any

import type { ExtractedFact } from "../_shared/agentClient.ts";
import type { DeltaType } from "../_shared/agentConfig.ts";
import type { GraphitiHit } from "../_shared/clients/graphitiSearch.ts";
import { LINKABLE_FACT_TYPES } from "./factRules.ts";

export interface LinkResult {
  delta_type: DeltaType;
  against_fact_id: string | null;
  matched_via?: "title" | "graph" | null;
}

export interface LinkOptions {
  searchHits?: GraphitiHit[] | null;
}

function titleOf(content: unknown): string {
  const c = content as Record<string, unknown> | null;
  const v =
    (typeof c?.title === "string" && c.title) || (typeof c?.name === "string" && c.name) || "";
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

export function linkAgainstExisting(
  f: ExtractedFact,
  existing: { id: string; fact_type: string; content: unknown }[],
  options: LinkOptions = {},
): LinkResult {
  if (!LINKABLE_FACT_TYPES.has(f.fact_type)) {
    return { delta_type: "add", against_fact_id: null, matched_via: null };
  }
  const needle = (f.title ?? "").trim().toLowerCase();
  if (!needle) return { delta_type: "add", against_fact_id: null, matched_via: null };

  const sameType = existing.filter((cf) => cf.fact_type === f.fact_type);

  // 1. Exakter Title-Match (klassisch).
  for (const cf of sameType) {
    if (titleOf(cf.content) === needle) {
      return { delta_type: "confirm", against_fact_id: cf.id, matched_via: "title" };
    }
  }

  // 2. Graph-Evidenz: irgendein Hit-Text enthält den Title als Substring +
  //    ein bestehender Fakt gleichen Typs hat einen Title, der ebenfalls in
  //    diesem Hit-Text vorkommt → confirm gegen diesen Fakt.
  const hits = options.searchHits ?? null;
  if (hits && hits.length > 0) {
    const lowered = hits.map((h) => h.fact.toLowerCase());
    const supporting = lowered.find((t) => t.includes(needle));
    if (supporting) {
      for (const cf of sameType) {
        const t = titleOf(cf.content);
        if (t && supporting.includes(t)) {
          return { delta_type: "confirm", against_fact_id: cf.id, matched_via: "graph" };
        }
      }
    }
  }

  return { delta_type: "add", against_fact_id: null, matched_via: null };
}
