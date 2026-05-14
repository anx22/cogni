/* eslint-disable @typescript-eslint/no-explicit-any */
import { fmtShort } from "@/lib/format/dateFormatters";
import type { VerlaufVM, DeltaTyp } from "../types";
import { titleFromJson } from "./humanize";

const eventTypeToErlaubnis = (t: string): VerlaufVM["ereignisTyp"] => {
  if (t === "contradict") return "konflikt";
  if (t === "confirm") return "entscheidung";
  return "aenderung";
};
const eventTypeToDelta = (t: string): DeltaTyp => {
  if (t === "confirm") return "bestaetigt";
  if (t === "contradict") return "widersprochen";
  if (t === "replace") return "ersetzt";
  return "neu";
};

export function toVerlauf(events: any[]): VerlaufVM[] {
  return events.map((e) => ({
    id: e.id,
    datum: fmtShort(e.created_at),
    delta: eventTypeToDelta(e.event_type),
    ereignisTyp: eventTypeToErlaubnis(e.event_type),
    inhalt: titleFromJson(e.new_value ?? e.previous_value, "Änderung"),
    objekt: "Fakt",
    quelle: "Verstehens-Loop",
  }));
}
