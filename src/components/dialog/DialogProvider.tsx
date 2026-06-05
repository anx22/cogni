import { useCallback, useEffect, useRef, useState, ReactNode } from "react";
import type { BoxState, DialogSession } from "@/lib/dialog/types";
import { END_STATES } from "@/lib/dialog/types";
import DialogOverlay from "./DialogOverlay";
import { DialogContext } from "./dialogContext";
import { supabase } from "@/integrations/supabase/client";
import { loadDialogSession } from "@/lib/dialog/loadSession";
import { submitNote } from "@/lib/intake/submitNote";
import { planCommitRoute } from "@/lib/dialog/commitRoute";
import { deriveSessionProgress } from "@/lib/dialog/reopenEscalated";
import { devlog } from "@/lib/devlog/devlog";
import { toast } from "sonner";

/**
 * `__submitIntent` / `__conflictIntent` markieren Boxen in Factory-Sessions.
 * Die reine Routing-Entscheidung lebt in `@/lib/dialog/commitRoute`
 * (`planCommitRoute`) und ist dort getestet; hier bleiben nur die
 * Seiteneffekte. Siehe sessionFactories.ts.
 */

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
      const previousState = box?.state;
      const isEscalate = userDecision?.escalate === true;
      updateBoxState(
        boxId,
        isEscalate ? "eskaliert" : decision === "confirm" ? "bestaetigt" : "verworfen",
      );

      // Reine Routing-Entscheidung (getestet in commitRoute.test.ts).
      const route = planCommitRoute({
        readonly,
        payload: box?.payload ?? null,
        decision,
        userDecision,
        sessionProjectId: session?.projectId ?? null,
        escalate: isEscalate,
      });
      const revert = () => {
        if (previousState) updateBoxState(boxId, previousState);
      };

      switch (route.kind) {
        case "escalate": {
          try {
            const { error } = await supabase
              .from("review_cases")
              .update({ box_state: "escalated" })
              .eq("id", route.reviewCaseId);
            if (error) throw error;
            // Session-Progress nachziehen: escalate läuft am commit-fact-EF vorbei,
            // der sonst updateSessionProgress() ruft. Logik gespiegelt (escalated
            // zählt als resolved), damit eine voll-eskalierte Session nicht
            // fälschlich „offen" bleibt (IntakeSessionsPanel / loadSession readonly).
            const sessionId = session?.id;
            if (sessionId) {
              const { data: stats } = await supabase
                .from("review_cases")
                .select("box_state")
                .eq("session_id", sessionId);
              const progress = deriveSessionProgress(
                (stats ?? []).map((c) => c.box_state as string),
              );
              await supabase
                .from("dialog_sessions")
                .update({
                  resolved_boxes: progress.resolved,
                  total_boxes: progress.total,
                  status: progress.status,
                })
                .eq("id", sessionId);
            }
            toast.info("Zurückgestellt", { description: "Kann später erneut geöffnet werden" });
            devlog.edge("escalate ok", { reviewCaseId: route.reviewCaseId });
          } catch (err) {
            revert();
            devlog.error("escalate failed", err);
            toast.error("Konnte nicht zurückstellen");
          }
          return;
        }

        case "resolve_conflict": {
          try {
            await supabase
              .from("contradictions")
              .update({ resolved: true })
              .eq("id", route.contradictionId);
            toast.success(`${route.label} bestätigt`, { description: "Widerspruch aufgelöst" });
            devlog.edge("resolve-conflict ok", {
              contradictionId: route.contradictionId,
              auswahl: route.auswahl,
            });
          } catch (err) {
            revert();
            devlog.error("resolve-conflict failed", err);
            toast.error("Konnte Widerspruch nicht auflösen");
          }
          return;
        }

        case "keep_conflict_open":
          toast.info("Widerspruch bleibt offen");
          return;

        case "topic_merge": {
          try {
            const { data, error } = await supabase.functions.invoke("topic-merge", {
              body: { candidate_id: route.candidateId, decision: route.efDecision },
            });
            if (error) throw error;
            if (data && data.ok === false) {
              revert();
              toast.error(data.error ?? "Konnte Merge nicht ausführen");
              return;
            }
            toast.success(
              route.efDecision === "merge" ? "Themen zusammengeführt" : "Getrennt belassen",
            );
            devlog.edge("topic-merge ok", {
              candidateId: route.candidateId,
              efDecision: route.efDecision,
            });
          } catch (err) {
            revert();
            devlog.error("topic-merge failed", err);
            toast.error("Konnte Merge nicht ausführen");
          }
          return;
        }

        case "intake_note_empty":
          devlog.warn("ui", "__submitIntent: kein text in userDecision", { boxId });
          return;

        case "intake_note": {
          try {
            const result = await submitNote(route.text, {
              projectId: route.projectId,
              contextHint: route.contextHint,
              sourceRef: route.sourceRef,
            });
            if (result) {
              toast.success("Antwort aufgenommen", { description: "wird analysiert" });
              devlog.edge("submit-intent intake_note ok", { boxId, assetId: result.assetId });
            } else {
              revert();
              toast.error("Konnte Antwort nicht speichern");
            }
          } catch (err) {
            revert();
            devlog.error("submit-intent intake_note failed", err);
            toast.error("Konnte Antwort nicht speichern");
          }
          return;
        }

        case "commit_fact": {
          try {
            const { data, error } = await supabase.functions.invoke("commit-fact", {
              body: {
                review_case_id: route.reviewCaseId,
                decision,
                user_decision: userDecision ?? null,
              },
            });
            if (error) throw error;
            if (data && data.ok === false) {
              revert();
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
              devlog.edge("commit-fact blocked", {
                reviewCaseId: route.reviewCaseId,
                code: data.code,
              });
              return;
            }
            devlog.edge("commit-fact ok", { reviewCaseId: route.reviewCaseId, decision });
          } catch (err) {
            revert();
            devlog.error("commit-fact failed", err);
            toast.error("Konnte Entscheidung nicht speichern");
          }
          return;
        }

        // ignore_readonly wird oben bereits abgefangen; noop = bewusst nichts.
        default:
          return;
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
    toast.success("Gespeichert.");
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
