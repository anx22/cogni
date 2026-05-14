/* eslint-disable @typescript-eslint/no-explicit-any */
import { ageInDays } from "@/lib/format/dateFormatters";
import type { GapVM } from "../types";

export function toGaps(gaps: any[]): GapVM[] {
  return gaps.map((g) => ({
    id: g.id,
    titel: g.title,
    wirkung: g.impact ?? "—",
    betrifft: g.affects ?? "—",
    lebensdauer: `seit ${ageInDays(g.detected_at)} Tagen offen`,
  }));
}
