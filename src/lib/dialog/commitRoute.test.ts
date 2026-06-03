import { describe, it, expect } from "vitest";
import { planCommitRoute, type CommitRouteInput } from "./commitRoute";

const base = (over: Partial<CommitRouteInput>): CommitRouteInput => ({
  readonly: false,
  payload: {},
  decision: "confirm",
  ...over,
});

describe("planCommitRoute", () => {
  it("readonly schlägt alles andere und ignoriert", () => {
    const route = planCommitRoute(base({ readonly: true, payload: { __reviewCaseId: "rc-1" } }));
    expect(route).toEqual({ kind: "ignore_readonly" });
  });

  it("Review-Case → commit-fact, Decision durchgereicht", () => {
    const route = planCommitRoute(
      base({ payload: { __reviewCaseId: "rc-1" }, decision: "reject" }),
    );
    expect(route).toEqual({ kind: "commit_fact", reviewCaseId: "rc-1", decision: "reject" });
  });

  it("Review-Case dominiert auch über vorhandene Intents", () => {
    const route = planCommitRoute(
      base({
        payload: {
          __reviewCaseId: "rc-1",
          __submitIntent: { kind: "intake_note" },
        },
      }),
    );
    expect(route.kind).toBe("commit_fact");
  });

  describe("Konflikt-Auflösung", () => {
    it("confirm + auswahl A → resolve mit 'Erste Version'", () => {
      const route = planCommitRoute(
        base({
          payload: { __conflictIntent: { kind: "resolve_conflict", contradictionId: "c-1" } },
          userDecision: { auswahl: "A" },
        }),
      );
      expect(route).toEqual({
        kind: "resolve_conflict",
        contradictionId: "c-1",
        auswahl: "A",
        label: "Erste Version",
      });
    });

    it("confirm + auswahl B → 'Zweite Version'", () => {
      const route = planCommitRoute(
        base({
          payload: { __conflictIntent: { kind: "resolve_conflict", contradictionId: "c-1" } },
          userDecision: { auswahl: "B" },
        }),
      );
      expect(route).toMatchObject({ auswahl: "B", label: "Zweite Version" });
    });

    it("confirm ohne auswahl → label 'Widerspruch', auswahl null", () => {
      const route = planCommitRoute(
        base({
          payload: { __conflictIntent: { kind: "resolve_conflict", contradictionId: "c-1" } },
        }),
      );
      expect(route).toMatchObject({ auswahl: null, label: "Widerspruch" });
    });

    it("reject → Widerspruch bleibt offen", () => {
      const route = planCommitRoute(
        base({
          decision: "reject",
          payload: { __conflictIntent: { kind: "resolve_conflict", contradictionId: "c-1" } },
        }),
      );
      expect(route).toEqual({ kind: "keep_conflict_open" });
    });
  });

  describe("Topic-Merge", () => {
    const mergePayload = {
      __submitIntent: {
        kind: "topic_merge" as const,
        candidateId: "cand-1",
        sourceTopicId: "s",
        targetTopicId: "t",
      },
    };

    it("confirm + 'Zusammenführen' → merge", () => {
      const route = planCommitRoute(
        base({ payload: mergePayload, userDecision: { aktion: "Zusammenführen" } }),
      );
      expect(route).toEqual({ kind: "topic_merge", candidateId: "cand-1", efDecision: "merge" });
    });

    it("confirm + 'Getrennt lassen' → reject", () => {
      const route = planCommitRoute(
        base({ payload: mergePayload, userDecision: { aktion: "Getrennt lassen" } }),
      );
      expect(route).toMatchObject({ efDecision: "reject" });
    });

    it("reject → reject (egal welche aktion)", () => {
      const route = planCommitRoute(
        base({
          decision: "reject",
          payload: mergePayload,
          userDecision: { aktion: "Zusammenführen" },
        }),
      );
      expect(route).toMatchObject({ efDecision: "reject" });
    });
  });

  describe("Intake-Note", () => {
    const notePayload = {
      __submitIntent: {
        kind: "intake_note" as const,
        projectId: "p-1",
        contextHint: "Hinweis aus: X",
        sourceRef: { type: "feedback", quelle: "X" },
      },
    };

    it("confirm + text → intake_note mit projektbezug aus Intent", () => {
      const route = planCommitRoute(
        base({ payload: notePayload, userDecision: { text: "Hallo" } }),
      );
      expect(route).toEqual({
        kind: "intake_note",
        text: "Hallo",
        projectId: "p-1",
        contextHint: "Hinweis aus: X",
        sourceRef: { type: "feedback", quelle: "X" },
      });
    });

    it("nimmt 'antwort' als Text-Fallback", () => {
      const route = planCommitRoute(
        base({ payload: notePayload, userDecision: { antwort: "Antwort" } }),
      );
      expect(route).toMatchObject({ kind: "intake_note", text: "Antwort" });
    });

    it("leerer/whitespace Text → intake_note_empty", () => {
      const route = planCommitRoute(base({ payload: notePayload, userDecision: { text: "   " } }));
      expect(route).toEqual({ kind: "intake_note_empty" });
    });

    it("fällt auf sessionProjectId zurück, wenn Intent keinen hat", () => {
      const route = planCommitRoute(
        base({
          payload: { __submitIntent: { kind: "intake_note" } },
          userDecision: { text: "x" },
          sessionProjectId: "p-session",
        }),
      );
      expect(route).toMatchObject({ projectId: "p-session" });
    });

    it("reject auf intake_note → noop (kein Schreiben)", () => {
      const route = planCommitRoute(base({ decision: "reject", payload: notePayload }));
      expect(route).toEqual({ kind: "noop" });
    });
  });

  it("Box nicht gefunden (payload null) → noop", () => {
    expect(planCommitRoute(base({ payload: null }))).toEqual({ kind: "noop" });
  });

  it("Factory-Box ohne Intent → noop", () => {
    expect(planCommitRoute(base({ payload: {} }))).toEqual({ kind: "noop" });
  });
});
