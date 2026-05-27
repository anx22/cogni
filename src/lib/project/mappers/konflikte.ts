/* eslint-disable @typescript-eslint/no-explicit-any */
import { fmtShort } from "@/lib/format/dateFormatters";
import { mapById } from "@/lib/utils";
import type { KonfliktVM, KonfliktFactRef, KonfliktEmpfehlung } from "../types";
import { titleFromJson } from "./humanize";

function buildFactRef(fact: any | null, fallbackLabel: string): KonfliktFactRef {
  if (!fact) {
    return { inhalt: fallbackLabel, datum: "", quelle: "", mode: "abgeleitet" };
  }
  const prov = (fact.provenance ?? {}) as Record<string, unknown>;
  const content = (fact.content ?? {}) as Record<string, unknown>;
  const conf = typeof prov.confidence === "number" ? prov.confidence : 0;
  const mode: KonfliktFactRef["mode"] = prov.corrected
    ? "direkt"
    : conf >= 0.8
      ? "direkt"
      : "abgeleitet";
  const dateSource =
    typeof content.due_date === "string" ? content.due_date : (fact.created_at as string | null);
  const datum = dateSource ? (fmtShort(dateSource) ?? "") : "";
  const quelle = mode === "direkt" ? "Direktquelle" : "Abgeleitet";
  return { inhalt: titleFromJson(fact.content, fallbackLabel), datum, quelle, mode };
}

function deriveEmpfehlung(factA: any, factB: any): KonfliktEmpfehlung | null {
  if (!factA || !factB) return null;

  const provA = (factA.provenance ?? {}) as Record<string, unknown>;
  const provB = (factB.provenance ?? {}) as Record<string, unknown>;
  const confA = typeof provA.confidence === "number" ? provA.confidence : 0.5;
  const confB = typeof provB.confidence === "number" ? provB.confidence : 0.5;
  const timeA = new Date(factA.created_at ?? 0).getTime();
  const timeB = new Date(factB.created_at ?? 0).getTime();

  const confDiff = Math.abs(confA - confB);
  if (confDiff >= 0.15) {
    const gewinner: "A" | "B" = confA >= confB ? "A" : "B";
    const winConf = gewinner === "A" ? confA : confB;
    return {
      gewinner,
      begruendung: `Höhere Zuverlässigkeit (${Math.round(winConf * 100)} %) — cogni bevorzugt diese Version.`,
      konfidenz: Math.min(0.95, confDiff * 4),
      tier: confDiff >= 0.25 ? 1 : 2,
    };
  }

  const dayDiff = Math.abs(timeA - timeB) / (1000 * 60 * 60 * 24);
  if (dayDiff >= 3) {
    const gewinner: "A" | "B" = timeA >= timeB ? "A" : "B";
    const days = Math.round(dayDiff);
    return {
      gewinner,
      begruendung: `Neuere Quelle — ${days} Tag${days === 1 ? "" : "e"} aktueller.`,
      konfidenz: Math.min(0.85, 0.5 + dayDiff / 200),
      tier: dayDiff >= 14 ? 1 : 2,
    };
  }

  return {
    gewinner: null,
    begruendung: "Beide Versionen ähnlich — bitte manuell entscheiden.",
    konfidenz: 0,
    tier: 2,
  };
}

export function toKonflikte(contradictions: any[], canonical: any[]): KonfliktVM[] {
  const factById = mapById(canonical);
  return contradictions.map((c) => {
    const a = c.fact_a_id ? (factById.get(c.fact_a_id) ?? null) : null;
    const b = c.fact_b_id ? (factById.get(c.fact_b_id) ?? null) : null;
    return {
      id: c.id,
      typ: c.contradiction_type,
      title: c.description ?? "Widerspruch",
      beschreibung: c.description ?? "",
      faktA: buildFactRef(a, "Fakt A"),
      faktB: buildFactRef(b, "Fakt B"),
      status: c.resolved ? "geloest" : "offen",
      empfehlung: deriveEmpfehlung(a, b),
    };
  });
}
