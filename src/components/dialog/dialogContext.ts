import { createContext, useContext } from "react";
import type { BoxState, DialogSession } from "@/lib/dialog/types";

export interface DialogContextValue {
  session: DialogSession | null;
  /** True wenn die aktuelle Session nur lesend angezeigt wird. */
  readonly: boolean;
  /**
   * Sperrgrund für Folge-Boxen, solange noch keine Projektzuordnung existiert.
   * null = keine Sperre.
   */
  gateReason: string | null;
  openDialog: (session: DialogSession) => void;
  closeDialog: () => void;
  updateBoxState: (boxId: string, state: BoxState) => void;
  updateBoxPayload: (boxId: string, patch: Record<string, any>) => void;
  /** Lädt eine echte Session aus der Datenbank und öffnet sie. */
  openSessionFromDB: (sessionId: string) => Promise<void>;
  /** Lädt die aktuelle Session erneut aus der Datenbank. */
  refreshFromDB: () => Promise<void>;
  /**
   * Persistente Entscheidung für eine Box. No-op im Read-Only-Modus.
   */
  commitBox: (
    boxId: string,
    decision: "confirm" | "reject",
    userDecision?: Record<string, any>,
  ) => Promise<void>;
}

export const DialogContext = createContext<DialogContextValue | null>(null);

export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within DialogProvider");
  return ctx;
};
