// =============================================================================
//  Entity-Core — Consumer-Hook.
//  useEntity() → aus globalem Provider (wirft wenn kein Provider).
//  (useEntityDetached folgt mit der OrbLab-Migration — OrbLab braucht freies
//   State-Setzen, das eine machine-gated Hook erst mit Force-Escape abdeckt.)
// =============================================================================

import { useContext } from "react";
import { EntityContext, type EntityContextValue } from "./entityContext";

export function useEntity(): EntityContextValue {
  const ctx = useContext(EntityContext);
  if (!ctx) throw new Error("useEntity must be used within EntityProvider");
  return ctx;
}
