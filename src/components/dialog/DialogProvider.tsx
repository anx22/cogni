import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import type { BoxState, DialogSession } from "@/lib/dialog/types";
import DialogOverlay from "./DialogOverlay";

interface DialogContextValue {
  session: DialogSession | null;
  openDialog: (session: DialogSession) => void;
  closeDialog: () => void;
  updateBoxState: (boxId: string, state: BoxState) => void;
  updateBoxPayload: (boxId: string, patch: Record<string, any>) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<DialogSession | null>(null);

  const openDialog = useCallback((s: DialogSession) => setSession(s), []);
  const closeDialog = useCallback(() => setSession(null), []);

  const updateBoxState = useCallback((boxId: string, state: BoxState) => {
    setSession((prev) =>
      prev
        ? { ...prev, boxes: prev.boxes.map((b) => (b.id === boxId ? { ...b, state } : b)) }
        : prev,
    );
  }, []);

  const updateBoxPayload = useCallback((boxId: string, patch: Record<string, any>) => {
    setSession((prev) =>
      prev
        ? {
            ...prev,
            boxes: prev.boxes.map((b) =>
              b.id === boxId ? { ...b, payload: { ...b.payload, ...patch } } : b,
            ),
          }
        : prev,
    );
  }, []);

  return (
    <DialogContext.Provider value={{ session, openDialog, closeDialog, updateBoxState, updateBoxPayload }}>
      {children}
      {session && <DialogOverlay />}
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within DialogProvider");
  return ctx;
};
