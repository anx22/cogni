// =============================================================================
//  gapDetector — Pure-Function Tests (B-W3)
// =============================================================================
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { detectGapsPure } from "./gapDetector.ts";

Deno.test("deadline ohne owner → 1 gap (deadline_without_owner)", () => {
  const out = detectGapsPure(
    { id: "f1", fact_type: "deadline", content: { title: "Launch", due_date: "2026-06-01" } },
    [],
  );
  assertEquals(out.length, 1);
  assertEquals(out[0].kind, "deadline_without_owner");
  assertEquals(out[0].canonical_fact_id, "f1");
});

Deno.test("deadline mit assignee → kein gap", () => {
  const out = detectGapsPure(
    {
      id: "f2",
      fact_type: "deadline",
      content: { title: "Launch", due_date: "2026-06-01", assignee: "Alice" },
    },
    [],
  );
  assertEquals(out.length, 0);
});

Deno.test("deadline mit owner-Variante (responsible) → kein gap", () => {
  const out = detectGapsPure(
    {
      id: "f3",
      fact_type: "deadline",
      content: { title: "Launch", due_date: "2026-06-01", responsible: "Bob" },
    },
    [],
  );
  assertEquals(out.length, 0);
});

Deno.test("decision ohne passende deadline → 1 gap (decision_without_deadline)", () => {
  const out = detectGapsPure(
    { id: "d1", fact_type: "decision", content: { title: "Wechsel zu PostgreSQL" } },
    [
      {
        id: "x1",
        fact_type: "deadline",
        content: { title: "Andere Sache", due_date: "2026-07-01" },
      },
    ],
  );
  assertEquals(out.length, 1);
  assertEquals(out[0].kind, "decision_without_deadline");
});

Deno.test("decision mit passender deadline (case-insensitive) → kein gap", () => {
  const out = detectGapsPure(
    { id: "d2", fact_type: "decision", content: { title: "Wechsel zu PostgreSQL" } },
    [
      {
        id: "dl1",
        fact_type: "deadline",
        content: { title: "wechsel zu postgresql", due_date: "2026-07-01" },
      },
    ],
  );
  assertEquals(out.length, 0);
});

Deno.test("task ohne due_date → 1 gap (task_without_due_date)", () => {
  const out = detectGapsPure(
    { id: "t1", fact_type: "task", content: { title: "Doku schreiben" } },
    [],
  );
  assertEquals(out.length, 1);
  assertEquals(out[0].kind, "task_without_due_date");
});

Deno.test("task mit due_date → kein gap", () => {
  const out = detectGapsPure(
    { id: "t2", fact_type: "task", content: { title: "Doku", due_date: "2026-08-01" } },
    [],
  );
  assertEquals(out.length, 0);
});

Deno.test("topic-Fakt → kein gap (Typ wird ignoriert)", () => {
  const out = detectGapsPure(
    { id: "tp1", fact_type: "topic", content: { title: "Performance" } },
    [],
  );
  assertEquals(out.length, 0);
});

Deno.test("deadline mit owner-Variante (owner) → kein gap", () => {
  const out = detectGapsPure(
    {
      id: "f4",
      fact_type: "deadline",
      content: { title: "Meilenstein", due_date: "2026-09-01", owner: "Clara" },
    },
    [],
  );
  assertEquals(out.length, 0);
});

Deno.test("deadline mit owner-Variante (assigned_to) → kein gap", () => {
  const out = detectGapsPure(
    {
      id: "f5",
      fact_type: "deadline",
      content: { title: "Abnahme", due_date: "2026-10-01", assigned_to: "Dave" },
    },
    [],
  );
  assertEquals(out.length, 0);
});
