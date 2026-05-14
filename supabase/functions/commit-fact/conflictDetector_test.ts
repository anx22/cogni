// =============================================================================
//  conflictDetector — Pure-Function Tests (B-W2)
// =============================================================================
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { detectConflictsPure } from "./conflictDetector.ts";

Deno.test("deadline: same title, different day → 1 conflict", () => {
  const fresh = {
    id: "new",
    fact_type: "deadline",
    content: { title: "Launch Beta", due_date: "2026-06-01T10:00:00Z" },
  };
  const others = [
    {
      id: "old1",
      fact_type: "deadline",
      content: { title: "launch beta", due_date: "2026-06-15T10:00:00Z" },
    },
  ];
  const out = detectConflictsPure(fresh, others);
  assertEquals(out.length, 1);
  assertEquals(out[0].type, "deadline");
  assertEquals(out[0].fact_b_id, "old1");
});

Deno.test("deadline: same day → no conflict", () => {
  const fresh = {
    id: "new",
    fact_type: "deadline",
    content: { title: "Review", due_date: "2026-07-01T10:00:00Z" },
  };
  const others = [
    {
      id: "old1",
      fact_type: "deadline",
      content: { title: "Review", due_date: "2026-07-01T18:00:00Z" },
    },
  ];
  assertEquals(detectConflictsPure(fresh, others).length, 0);
});

Deno.test("decision: same title, different outcome → 1 conflict", () => {
  const fresh = {
    id: "new",
    fact_type: "decision",
    content: { title: "Hosting", outcome: "AWS" },
  };
  const others = [
    {
      id: "old1",
      fact_type: "decision",
      content: { title: "Hosting", outcome: "GCP" },
    },
  ];
  const out = detectConflictsPure(fresh, others);
  assertEquals(out.length, 1);
  assertEquals(out[0].type, "decision");
});

Deno.test("decision: same outcome → no conflict", () => {
  const fresh = {
    id: "new",
    fact_type: "decision",
    content: { title: "Hosting", outcome: "AWS" },
  };
  const others = [
    { id: "old1", fact_type: "decision", content: { title: "Hosting", outcome: "AWS" } },
  ];
  assertEquals(detectConflictsPure(fresh, others).length, 0);
});

Deno.test("non-conflict types ignored", () => {
  const fresh = { id: "new", fact_type: "stakeholder", content: { name: "Alice" } };
  const others = [{ id: "old", fact_type: "stakeholder", content: { name: "Alice" } }];
  assertEquals(detectConflictsPure(fresh, others).length, 0);
});

Deno.test("self-row excluded", () => {
  const fresh = {
    id: "x",
    fact_type: "deadline",
    content: { title: "T", due_date: "2026-01-01" },
  };
  const others = [
    { id: "x", fact_type: "deadline", content: { title: "T", due_date: "2026-02-02" } },
  ];
  assertEquals(detectConflictsPure(fresh, others).length, 0);
});
