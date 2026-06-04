// =============================================================================
//  Entity-Core — Globaler Provider.
//  Mountet Machine + Sources + Presets + Kommunikation EINMAL;
//  alle Consumer via useEntity(). Achse 1 (State) + Achse 2 (Interaction-Mode)
//  + dritte Säule (Utterance) laufen aus EINEM Signal-Stream.
// =============================================================================

import { useCallback, useMemo, useReducer, useRef, type ReactNode } from "react";
import { useEntityMachine } from "./useEntityMachine";
import { useEntityPresets } from "./useEntityPresets";
import { useEntitySources } from "./useEntitySources";
import { useEntityCommunication } from "./communication/useEntityCommunication";
import { reduceInteraction, type InteractionAction } from "./interaction";
import { EntityContext, type EntityController, type EntityContextValue } from "./entityContext";
import type { EntitySignal } from "./types";

interface EntityProviderProps {
  children: ReactNode;
}

export function EntityProvider({ children }: EntityProviderProps) {
  const { state, dispatch } = useEntityMachine();
  const [mode, interact] = useReducer(reduceInteraction, "resting");
  const autoOpenHandlerRef = useRef<((sessionId: string) => void) | null>(null);

  const { utterance, pushInput } = useEntityCommunication();
  const { openPendingSession } = useEntitySources(dispatch, autoOpenHandlerRef, pushInput);
  const { vm, characterId } = useEntityPresets(state, mode);

  const interactDispatch = useCallback((action: InteractionAction) => interact(action), []);

  const controller = useMemo<EntityController>(
    () => ({
      signal: (sig: EntitySignal) => dispatch(sig),
      interact: interactDispatch,
      setAutoOpenHandler: (fn) => {
        autoOpenHandlerRef.current = fn;
      },
      openPendingSession,
    }),
    [dispatch, interactDispatch, openPendingSession],
  );

  const value = useMemo<EntityContextValue>(
    () => ({ state, vm, characterId, utterance, controller }),
    [state, vm, characterId, utterance, controller],
  );

  return <EntityContext.Provider value={value}>{children}</EntityContext.Provider>;
}
