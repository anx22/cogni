import { useCallback, useState, ReactNode } from "react";
import type { BoxState, DialogSession } from "@/lib/dialog/types";
import DialogOverlay from "./DialogOverlay";
import { DialogContext } from "./dialogContext";

export { useDialog } from "./dialogContext";

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
