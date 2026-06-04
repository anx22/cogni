// =============================================================================
//  Entity-Core — Context-Objekt + öffentlicher Vertrag.
//  Spiegelt das dialogContext.ts-Pattern: Context separat vom Provider.
// =============================================================================

import { createContext } from "react";
import type { EntityState, EntitySignal, ExpressionVM, CharacterId } from "./types";
import type { InteractionAction } from "./interaction";
import type { Utterance } from "./communication/types";

export interface EntityController {
  signal(sig: EntitySignal): void;
  /** Achse 2 — Composer treibt den Interaction-Mode (Open/Pick/Close). */
  interact(action: InteractionAction): void;
  setAutoOpenHandler(fn: ((sessionId: string) => void) | null): void;
  openPendingSession(): void;
}

export interface EntityContextValue {
  state: EntityState;
  vm: ExpressionVM;
  characterId: CharacterId;
  /** Was die Entität gerade sagt (dritte Säule, aus dem Signal-Stream). */
  utterance: Utterance | null;
  controller: EntityController;
}

export const EntityContext = createContext<EntityContextValue | null>(null);
