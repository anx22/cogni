import { describe, it, expect } from "vitest";
import { toHandlungsbedarf } from "./handlungsbedarf";

const empty = {
  decisions: [],
  contradictions: [],
  gaps: [],
  openPoints: [],
  tasks: [],
  feedbackRows: [],
  deps: [],
};

describe("toHandlungsbedarf — zurückgestellt", () => {
  it("eskalierter Case wird zu einem Prüfen-Item mit Reopen-Anker", () => {
    const out = toHandlungsbedarf({
      ...empty,
      zurueckgestellt: [
        { id: "rc-9", title: "Budget offen", description: "Später klären", session_id: "sess-3" },
      ],
    });
    expect(out).toHaveLength(1);
    const item = out[0];
    expect(item.objektTyp).toBe("zurueckgestellt");
    expect(item.arbeitsmodus).toBe("pruefen");
    expect(item.id).toBe("esc-rc-9");
    expect(item.titel).toBe("Budget offen");
    expect(item.reopen).toEqual({ caseId: "rc-9", sessionId: "sess-3" });
    expect(item.blocker).toBe(false);
  });

  it("ohne zurueckgestellt-Feld bleibt die Liste leer (Alt-Fixtures unberührt)", () => {
    expect(toHandlungsbedarf(empty)).toHaveLength(0);
  });

  it("Titel/Beschreibung fallen weich zurück, wenn null", () => {
    const out = toHandlungsbedarf({
      ...empty,
      zurueckgestellt: [{ id: "rc-1", title: null, description: null, session_id: "s-1" }],
    });
    expect(out[0].titel).toBe("Zurückgestellte Erkenntnis");
    expect(out[0].beschreibung).toBe("Später erneut entscheiden.");
  });
});
