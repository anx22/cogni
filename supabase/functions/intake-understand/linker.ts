// =============================================================================
//  intake-understand / linker — pure linking logic.
// =============================================================================
// deno-lint-ignore-file no-explicit-any

import type { ExtractedFact } from "../_shared/agentClient.ts";
import type { DeltaType } from "../_shared/agentConfig.ts";
import { LINKABLE_FACT_TYPES } from "./factRules.ts";

export function linkAgainstExisting(
  f: ExtractedFact,
  existing: { id: string; fact_type: string; content: unknown }[],
): { delta_type: DeltaType; against_fact_id: string | null } {
  if (!LINKABLE_FACT_TYPES.has(f.fact_type)) {
    return { delta_type: "add", against_fact_id: null };
  }
  const needle = (f.title ?? "").trim().toLowerCase();
  if (!needle) return { delta_type: "add", against_fact_id: null };

  for (const cf of existing) {
    if (cf.fact_type !== f.fact_type) continue;
    const c = cf.content as Record<string, unknown> | null;
    const hay =
      (typeof c?.title === "string" && c.title) ||
      (typeof c?.name === "string" && c.name) ||
      "";
    if (typeof hay === "string" && hay.trim().toLowerCase() === needle) {
      return { delta_type: "confirm", against_fact_id: cf.id };
    }
  }
  return { delta_type: "add", against_fact_id: null };
}
