// =============================================================================
//  Entity-Core — React-Wrapper um die pure transition()-Funktion.
// =============================================================================

import { useState, useCallback } from "react";
import { transition } from "./machine";
import type { EntityState, EntitySignal } from "./types";

export function useEntityMachine(initial: EntityState = "idle") {
  const [state, setState] = useState<EntityState>(initial);
  const dispatch = useCallback((sig: EntitySignal) => {
    setState((s) => transition(s, sig));
  }, []);
  return { state, dispatch };
}
