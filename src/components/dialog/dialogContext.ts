import { createContext, useContext } from "react";
import type { BoxState, DialogSession } from "@/lib/dialog/types";

export interface DialogContextValue {
  session: DialogSession | null;
  openDialog: (session: DialogSession) => void;
  closeDialog: () => void;
  updateBoxState: (boxId: string, state: BoxState) => void;
  updateBoxPayload: (boxId: string, patch: Record<string, any>) => void;
}

export const DialogContext = createContext<DialogContextValue | null>(null);

export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within DialogProvider");
  return ctx;
};
