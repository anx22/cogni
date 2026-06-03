// =============================================================================
//  Entity-Core — Consumer-Hooks.
//  useEntity()         → aus globalem Provider (wirft wenn kein Provider)
//  useEntityDetached() → lokale Instanz ohne Sources (für OrbLab)
// =============================================================================

import { useContext, useMemo } from "react";
import { EntityContext, type EntityContextValue, type EntityController } from "./entityContext";
import { useEntityMachine } from "./useEntityMachine";
import { useEntityPresets } from "./useEntityPresets";
import type { EntityState, EntitySignal } from "./types";

export function useEntity(): EntityContextValue {
  const ctx = useContext(EntityContext);
  if (!ctx) throw new Error("useEntity must be used within EntityProvider");
  return ctx;
}

export function useEntityDetached(initial: EntityState = "idle"): EntityContextValue {
  const { state, dispatch } = useEntityMachine(initial);
  const { vm, characterId } = useEntityPresets(state);
  const controller = useMemo<EntityController>(
    () => ({
      signal: (sig: EntitySignal) => dispatch(sig),
      setAutoOpenHandler: () => {},
      openPendingSession: () => {},
    }),
    [dispatch],
  );
  return useMemo(
    () => ({ state, vm, characterId, controller }),
    [state, vm, characterId, controller],
  );
}
