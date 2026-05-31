/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DependencyVM, Empfehlung } from "../types";

// =============================================================================
// Dependency-Heuristik — Empfehlung nur bei klar typisierter Abhängigkeit.
// Konfidenz bewusst niedrig: User soll bewusst bestätigen, kein Auto-Klick.
// =============================================================================
export function deriveDepEmpfehlung(
  typ: string,
  source: string | null,
  target: string | null,
): Empfehlung | null {
  if (!source || !target) return null;
  if (typ === "blockiert_durch") {
    return {
      kind: "dependency",
      vorschlag: "Als nicht mehr blockiert markieren",
      begruendung: `${source} hängt an ${target} — übernehmen, wenn das geklärt ist`,
      konfidenz: "niedrig",
      intent: "submit_value",
      payload: { antwort: "nicht mehr blockiert" },
    };
  }
  if (typ === "wartet_auf") {
    return {
      kind: "dependency",
      vorschlag: `Status von „${target}" prüfen`,
      begruendung: `${source} wartet auf ${target}`,
      konfidenz: "niedrig",
      intent: "submit_value",
      payload: { antwort: `Status ${target}: ` },
    };
  }
  return null;
}

export function toDependencies(deps: any[]): DependencyVM[] {
  return deps.map((d) => ({
    id: d.id,
    typ: d.dependency_type,
    quelle: d.source_type,
    ziel: d.target_type,
    beschreibung: d.description ?? "",
    empfehlung: deriveDepEmpfehlung(d.dependency_type, d.source_type, d.target_type),
  }));
}
