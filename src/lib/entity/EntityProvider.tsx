// =============================================================================
//  Entity-Core — Globaler Provider.
//  Mountet Machine + Sources + Presets EINMAL; alle Consumer via useEntity().
// =============================================================================

import { useMemo, useRef, type ReactNode } from "react";
import { useEntityMachine } from "./useEntityMachine";
import { useEntityPresets } from "./useEntityPresets";
import { useEntitySources } from "./useEntitySources";
import { EntityContext, type EntityController, type EntityContextValue } from "./entityContext";
import type { EntitySignal } from "./types";

interface EntityProviderProps {
  children: ReactNode;
}

export function EntityProvider({ children }: EntityProviderProps) {
  const { state, dispatch } = useEntityMachine();
  const autoOpenHandlerRef = useRef<((sessionId: string) => void) | null>(null);

  const { openPendingSession } = useEntitySources(dispatch, autoOpenHandlerRef);
  const { vm, characterId } = useEntityPresets(state);

  const controller = useMemo<EntityController>(
    () => ({
      signal: (sig: EntitySignal) => dispatch(sig),
      setAutoOpenHandler: (fn) => {
        autoOpenHandlerRef.current = fn;
      },
      openPendingSession,
    }),
    [dispatch, openPendingSession],
  );

  const value = useMemo<EntityContextValue>(
    () => ({ state, vm, characterId, controller }),
    [state, vm, characterId, controller],
  );

  return <EntityContext.Provider value={value}>{children}</EntityContext.Provider>;
}
