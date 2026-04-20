// =============================================================================
//  sessionMode — leitet aus DB-Status + Boxen ab, ob eine Session
//  noch bearbeitet werden darf oder nur noch nachgelesen wird.
// =============================================================================

import type { DialogBox, DialogMode } from "./types";
import { END_STATES } from "./types";

export function deriveSessionMode(
  status: string | null | undefined,
  boxes: DialogBox[],
): DialogMode {
  if (status === "completed" || status === "cancelled") return "readonly";
  // Falls alle Entscheidungs-Boxen bereits final sind → ebenfalls readonly
  const decisionBoxes = boxes.filter((b) => b.type !== "kontext");
  if (decisionBoxes.length > 0 && decisionBoxes.every((b) => END_STATES.includes(b.state))) {
    return "readonly";
  }
  return "edit";
}
