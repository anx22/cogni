// =============================================================================
//  Entity-Core — Context-Objekt + öffentlicher Vertrag.
//  Spiegelt das dialogContext.ts-Pattern: Context separat vom Provider.
// =============================================================================

import { createContext } from "react";
import type { EntityState, EntitySignal, ExpressionVM, CharacterId } from "./types";

export interface EntityController {
  signal(sig: EntitySignal): void;
  setAutoOpenHandler(fn: ((sessionId: string) => void) | null): void;
  openPendingSession(): void;
}

export interface EntityContextValue {
  state: EntityState;
  vm: ExpressionVM;
  characterId: CharacterId;
  controller: EntityController;
}

export const EntityContext = createContext<EntityContextValue | null>(null);
