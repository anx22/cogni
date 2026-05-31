/* eslint-disable @typescript-eslint/no-explicit-any */
import { ageInDays } from "@/lib/format/dateFormatters";
import type { Empfehlung, GapVM } from "../types";

// =============================================================================
// Gap-Heuristik — ehrliche Empfehlung NUR wenn die vorhandenen Felder eine
// substanzielle Aussage erlauben. Sonst `null`. Keine erfundene KI.
// =============================================================================
function deriveGapEmpfehlung(
  affects: string | null,
  impact: string | null,
  ageDays: number,
): Empfehlung | null {
  if (!affects || affects === "—") return null;
  const vorschlag = `Wert für „${affects}" ergänzen`;
  const bausteine: string[] = [];
  if (ageDays >= 1) bausteine.push(`${ageDays} Tag${ageDays === 1 ? "" : "e"} offen`);
  if (impact && impact !== "—") bausteine.push(`blockiert ${impact.toLowerCase()}`);
  const begruendung = bausteine.join(" · ") || "Eintrag fehlt";
  const konfidenz: Empfehlung["konfidenz"] =
    ageDays < 3 ? "hoch" : ageDays < 14 ? "mittel" : "niedrig";
  return {
    kind: "gap",
    vorschlag,
    begruendung,
    konfidenz,
    intent: "submit_value",
  };
}

export function toGaps(gaps: any[]): GapVM[] {
  return gaps.map((g) => {
    const age = ageInDays(g.detected_at);
    return {
      id: g.id,
      titel: g.title,
      wirkung: g.impact ?? "—",
      betrifft: g.affects ?? "—",
      lebensdauer: `seit ${age} Tagen offen`,
      empfehlung: deriveGapEmpfehlung(g.affects ?? null, g.impact ?? null, age),
    };
  });
}
