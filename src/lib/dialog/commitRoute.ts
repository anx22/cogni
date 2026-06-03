// =============================================================================
//  commitRoute — reine Routing-Entscheidung für den Commit-Pfad (F3, R5).
//
//  `commitBox` im DialogProvider trägt mehrere verschachtelte Verzweigungen:
//  readonly-Gate, Konflikt-Auflösung, Topic-Merge, Intake-Note und der
//  eigentliche commit-fact-Aufruf. Diese Funktion isoliert die *Entscheidung*
//  (welcher Pfad, mit welchen abgeleiteten Parametern) von den Seiteneffekten
//  (Supabase, Toasts, State). Dadurch wird der Hot-Path testbar, ohne die
//  optimistische UI-Logik anzufassen.
//
//  Seiteneffekte (updateBoxState, supabase, toast, devlog) bleiben im Provider.
// =============================================================================

export type SubmitIntent =
  | {
      kind: "intake_note";
      projectId?: string | null;
      contextHint?: string;
      sourceRef?: { type: string; id?: string; quelle?: string };
    }
  | {
      kind: "topic_merge";
      candidateId: string;
      sourceTopicId: string;
      targetTopicId: string;
    };

export type ConflictIntent = {
  kind: "resolve_conflict";
  contradictionId: string;
};

/** Was an Payload-Markern für die Entscheidung relevant ist. */
export interface CommitBoxPayload {
  __reviewCaseId?: string;
  __conflictIntent?: ConflictIntent;
  __submitIntent?: SubmitIntent;
}

export interface CommitRouteInput {
  readonly: boolean;
  /** null, wenn die Box nicht gefunden wurde. */
  payload: CommitBoxPayload | null;
  decision: "confirm" | "reject";
  userDecision?: Record<string, unknown>;
  /** Fallback-Projekt aus der Session für intake_note. */
  sessionProjectId?: string | null;
}

export type CommitRoute =
  | { kind: "ignore_readonly" }
  | { kind: "resolve_conflict"; contradictionId: string; auswahl: "A" | "B" | null; label: string }
  | { kind: "keep_conflict_open" }
  | { kind: "topic_merge"; candidateId: string; efDecision: "merge" | "reject" }
  | {
      kind: "intake_note";
      text: string;
      projectId: string | null;
      contextHint?: string;
      sourceRef?: { type: string; id?: string; quelle?: string };
    }
  | { kind: "intake_note_empty" }
  | { kind: "commit_fact"; reviewCaseId: string; decision: "confirm" | "reject" }
  | { kind: "noop" };

const conflictLabel = (auswahl: "A" | "B" | null): string =>
  auswahl === "A" ? "Erste Version" : auswahl === "B" ? "Zweite Version" : "Widerspruch";

/**
 * Entscheidet rein funktional, welcher Commit-Pfad genommen wird.
 * Verändert nichts — der Aufrufer führt die Seiteneffekte aus.
 */
export function planCommitRoute(input: CommitRouteInput): CommitRoute {
  const { readonly, payload, decision, userDecision, sessionProjectId } = input;

  if (readonly) return { kind: "ignore_readonly" };

  const reviewCaseId = payload?.__reviewCaseId;

  // Backend-Review-Case → commit-fact dominiert.
  if (reviewCaseId) {
    return { kind: "commit_fact", reviewCaseId, decision };
  }

  // Factory-Session ohne Review-Case.
  const conflictIntent = payload?.__conflictIntent;
  if (conflictIntent?.kind === "resolve_conflict") {
    if (decision === "confirm") {
      const auswahl = (userDecision?.auswahl as "A" | "B") ?? null;
      return {
        kind: "resolve_conflict",
        contradictionId: conflictIntent.contradictionId,
        auswahl,
        label: conflictLabel(auswahl),
      };
    }
    return { kind: "keep_conflict_open" };
  }

  const intent = payload?.__submitIntent;
  if (intent?.kind === "topic_merge") {
    const aktion = (userDecision?.aktion as string | undefined) ?? null;
    const efDecision: "merge" | "reject" =
      decision === "confirm" && aktion === "Zusammenführen" ? "merge" : "reject";
    return { kind: "topic_merge", candidateId: intent.candidateId, efDecision };
  }

  if (decision === "confirm" && intent?.kind === "intake_note") {
    const text =
      (userDecision?.text as string | undefined) ??
      (userDecision?.antwort as string | undefined) ??
      "";
    if (!text.trim()) return { kind: "intake_note_empty" };
    return {
      kind: "intake_note",
      text,
      projectId: intent.projectId ?? sessionProjectId ?? null,
      contextHint: intent.contextHint,
      sourceRef: intent.sourceRef,
    };
  }

  return { kind: "noop" };
}
