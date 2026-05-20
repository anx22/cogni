import { useCallback, useEffect, useRef, useState, ReactNode } from "react";
import type { BoxState, DialogSession } from "@/lib/dialog/types";
import { END_STATES } from "@/lib/dialog/types";
import DialogOverlay from "./DialogOverlay";
import { DialogContext } from "./dialogContext";
import { supabase } from "@/integrations/supabase/client";
import { loadDialogSession } from "@/lib/dialog/loadSession";
import { submitNote } from "@/lib/intake/submitNote";
import { devlog } from "@/lib/devlog/devlog";
import { toast } from "sonner";

/**
 * `__submitIntent` markiert Eingabe-Boxen in Factory-Sessions, deren Antwort
 * nicht via commit-fact persistiert wird, sondern als Notiz durch die
 * Verstehens-Pipeline fließt (Handlungsbedarf-Antwort, Feedback, Rückfrage,
 * Korrektur). Siehe sessionFactories.ts.
 */
type SubmitIntent = {
  kind: "intake_note";
  projectId?: string | null;
  contextHint?: string;
  sourceRef?: { type: string; id?: string; quelle?: string };
};

// eslint-disable-next-line react-refresh/only-export-components -- gewollter Hook-Re-Export, alle Caller importieren `useDialog` von hier.
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

  const updateBoxPayload = useCallback((boxId: string, patch: Record<string, unknown>) => {
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

  const readonly = session?.mode === "readonly";

  // Gating: existiert eine offene Zuordnungsbox, sind Folge-Boxen gesperrt.
  const assignmentBox = session?.boxes.find((b) => b.type === "zuordnung");
  const gateReason =
    !readonly && assignmentBox && !END_STATES.includes(assignmentBox.state)
      ? "Erst Projekt wählen"
      : null;

  const commitBox = useCallback(
    async (
      boxId: string,
      decision: "confirm" | "reject",
      userDecision?: Record<string, unknown>,
    ) => {
      if (readonly) {
        devlog.warn("ui", "commitBox ignored — session is read-only");
        return;
      }
      const box = session?.boxes.find((b) => b.id === boxId);
      const reviewCaseId = box?.payload?.__reviewCaseId as string | undefined;

      const previousState = box?.state;
      updateBoxState(boxId, decision === "confirm" ? "bestaetigt" : "verworfen");

      if (!reviewCaseId) {
        // Factory-Sessions ohne Backend-Review-Case. Wenn die Box ein
        // __submitIntent trägt UND bestätigt wurde, route die User-Eingabe
        // durch die passende Pipeline (heute: intake_note für Antwort/Feedback/
        // Rückfrage/Korrektur). Verwerfen oder fehlender Intent → silent.
        const intent = box?.payload?.__submitIntent as SubmitIntent | undefined;
        if (decision === "confirm" && intent?.kind === "intake_note") {
          const text =
            (userDecision?.text as string | undefined) ??
            (userDecision?.antwort as string | undefined) ??
            "";
          if (!text.trim()) {
            devlog.warn("ui", "__submitIntent: kein text in userDecision", { boxId });
            return;
          }
          try {
            const result = await submitNote(text, {
              projectId: intent.projectId ?? session?.projectId ?? null,
              contextHint: intent.contextHint,
              sourceRef: intent.sourceRef,
            });
            if (result) {
              toast.success("Antwort aufgenommen", { description: "wird verstanden" });
              devlog.edge("submit-intent intake_note ok", { boxId, assetId: result.assetId });
            } else {
              if (previousState) updateBoxState(boxId, previousState);
              toast.error("Konnte Antwort nicht speichern");
            }
          } catch (err) {
            if (previousState) updateBoxState(boxId, previousState);
            devlog.error("submit-intent intake_note failed", err);
            toast.error("Konnte Antwort nicht speichern");
          }
        }
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke("commit-fact", {
          body: { review_case_id: reviewCaseId, decision, user_decision: userDecision ?? null },
        });
        if (error) throw error;
        if (data && data.ok === false) {
          if (previousState) updateBoxState(boxId, previousState);
          if (data.code === "NEEDS_ASSIGNMENT") {
            const assignment = session?.boxes.find((b) => b.type === "zuordnung");
            if (assignment) {
              const el = document.getElementById(`dialog-box-${assignment.id}`);
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
              el?.classList.add("ring-2", "ring-primary/60", "rounded-xl");
              setTimeout(
                () => el?.classList.remove("ring-2", "ring-primary/60", "rounded-xl"),
                2400,
              );
            }
            toast.message("Erst Projekt wählen", {
              description: "Entscheide zuerst die Zuordnungsbox oben.",
            });
          } else {
            toast.error(data.error ?? "Konnte Entscheidung nicht speichern");
          }
          devlog.edge("commit-fact blocked", { reviewCaseId, code: data.code });
          return;
        }
        devlog.edge("commit-fact ok", { reviewCaseId, decision });
      } catch (err) {
        if (previousState) updateBoxState(boxId, previousState);
        devlog.error("commit-fact failed", err);
        toast.error("Konnte Entscheidung nicht speichern");
      }
    },
    [session, updateBoxState, readonly],
  );

  // Auto-Close: alle Entscheidungs-Boxen final → kurz bestätigen + schließen
  const autoClosedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!session || readonly) return;
    if (autoClosedRef.current === session.id) return;
    const decisionBoxes = session.boxes.filter((b) => b.type !== "kontext");
    if (decisionBoxes.length === 0) return;
    const allDone = decisionBoxes.every((b) => END_STATES.includes(b.state));
    if (!allDone) return;
    autoClosedRef.current = session.id;
    toast.success("Verstanden — abgeschlossen.");
    const t = setTimeout(() => setSession(null), 1200);
    return () => clearTimeout(t);
  }, [session, readonly]);

  return (
    <DialogContext.Provider
      value={{
        session,
        readonly: !!readonly,
        gateReason,
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
