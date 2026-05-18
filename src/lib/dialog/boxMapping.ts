// =============================================================================
//  DB-Box-Typ → UI-Box-Typ.
//  Mapping ist 1:1 — Backend hat die Klassifikation bereits gemacht (entweder
//  via modality der Verstehens-Pipeline oder Fallback aus fact_type).
// =============================================================================

import type { Database } from "@/integrations/supabase/types";
import type { BoxType as UIBoxType } from "@/lib/dialog/types";

type DBBoxType = Database["public"]["Enums"]["box_type"];

const DB_TO_UI: Record<DBBoxType, UIBoxType> = {
  // klassisch
  knowledge: "wissen",
  assignment: "zuordnung",
  conflict: "konflikt",
  selection: "auswahl",
  input: "eingabe",
  context: "kontext",
  action: "aktion",
  gap_box: "gap",
  // Sprechhandlungen
  condition: "bedingung",
  exclusion: "ausschluss",
  assumption: "annahme",
  suggestion: "vorschlag",
  question: "frage",
  note: "notiz",
  relation: "beziehung",
  attribute: "attribut",
  risk: "risiko",
  unclear: "unklar",
};

export function dbBoxTypeToUI(t: DBBoxType): UIBoxType {
  return DB_TO_UI[t] ?? "wissen";
}
