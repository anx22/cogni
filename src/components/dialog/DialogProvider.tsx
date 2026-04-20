import { useCallback, useState, ReactNode } from "react";
import type { BoxState, DialogSession } from "@/lib/dialog/types";
import DialogOverlay from "./DialogOverlay";
import { DialogContext } from "./dialogContext";
import { supabase } from "@/integrations/supabase/client";
import { loadDialogSession } from "@/lib/dialog/loadSession";
import { devlog } from "@/lib/devlog/devlog";
import { toast } from "sonner";

export { useDialog } from "./dialogContext";

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<DialogSession | null>(null);

  const openDialog = useCallback((s: DialogSession) => setSession(s), []);
  const closeDialog = useCallback(() => setSession(null), []);

  const openSessionFromDB = useCallback(async (sessionId: string) => {
    const s = await loadDialogSession(sessionId);
    if (s) setSession(s);
  }, []);

  const refreshFromDB = useCallback(async () => {
    if (!session) return;
    const fresh = await loadDialogSession(session.id);
    if (fresh) setSession(fresh);
  }, [session]);

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

  // ---- Persistenter Pfad: ruft commit-fact, fällt auf reine UI-Updates zurück
  const commitBox = useCallback(
    async (boxId: string, decision: "confirm" | "reject", userDecision?: Record<string, any>) => {
      const box = session?.boxes.find((b) => b.id === boxId);
      const reviewCaseId = box?.payload?.__reviewCaseId as string | undefined;

      // Optimistic UI
      updateBoxState(boxId, decision === "confirm" ? "bestaetigt" : "verworfen");

      if (!reviewCaseId) {
        // Demo-Box ohne DB-Pendant — nichts persistieren.
        return;
      }
      try {
        const { error } = await supabase.functions.invoke("commit-fact", {
          body: { review_case_id: reviewCaseId, decision, user_decision: userDecision ?? null },
        });
        if (error) throw error;
        devlog.edge("commit-fact ok", { reviewCaseId, decision });
      } catch (err) {
        devlog.error("commit-fact failed", err);
        toast.error("Konnte Entscheidung nicht speichern");
      }
    },
    [session, updateBoxState],
  );

  return (
    <DialogContext.Provider
      value={{
        session,
        openDialog,
        closeDialog,
        updateBoxState,
        updateBoxPayload,
        openSessionFromDB,
        refreshFromDB,
        commitBox,
      }}
    >
      {children}
      {session && <DialogOverlay />}
    </DialogContext.Provider>
  );
};
