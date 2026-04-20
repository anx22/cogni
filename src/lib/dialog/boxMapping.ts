// =============================================================================
//  FRONTEND-Spiegel der Box-Mapping-Logik (für Anzeige + Type-Sicherheit)
// -----------------------------------------------------------------------------
//  Das eigentliche Mapping passiert serverseitig in supabase/functions/_shared/
//  agentConfig.ts. Diese Datei mappt nur den DB-Wert (box_type aus review_cases)
//  auf den UI-Box-Typ ("wissen", "konflikt", "gap", ...).
// =============================================================================

import type { Database } from "@/integrations/supabase/types";
import type { BoxType as UIBoxType } from "@/lib/dialog/types";

type DBBoxType = Database["public"]["Enums"]["box_type"];

const DB_TO_UI: Record<DBBoxType, UIBoxType> = {
  knowledge: "wissen",
  assignment: "zuordnung",
  conflict: "konflikt",
  selection: "auswahl",
  input: "eingabe",
  context: "kontext",
  action: "aktion",
  gap_box: "gap",
};

export function dbBoxTypeToUI(t: DBBoxType): UIBoxType {
  return DB_TO_UI[t] ?? "wissen";
}
