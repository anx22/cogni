// =============================================================================
//  dependencyDetector — Pure-Function Tests (B-W4)
// =============================================================================
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { detectDependenciesPure } from "./dependencyDetector.ts";

Deno.test("task mit 'blockiert von <Title>' → 1 dep blockiert_durch", () => {
  const out = detectDependenciesPure(
    {
      id: "t1",
      fact_type: "task",
      content: { title: "Statik prüfen", description: "blockiert von Statik-Freigabe Tübingen" },
    },
    [{ id: "d1", fact_type: "decision", content: { title: "Statik-Freigabe Tübingen" } }],
  );
  assertEquals(out.length, 1);
  assertEquals(out[0].dependency_type, "blockiert_durch");
  assertEquals(out[0].target_id, "d1");
});

Deno.test("task ohne Trigger → 0", () => {
  const out = detectDependenciesPure(
    {
      id: "t2",
      fact_type: "task",
      content: { title: "Statik prüfen", description: "Statik-Freigabe Tübingen" },
    },
    [{ id: "d1", fact_type: "decision", content: { title: "Statik-Freigabe Tübingen" } }],
  );
  assertEquals(out.length, 0);
});

Deno.test("task mit Trigger aber kein Match → 0", () => {
  const out = detectDependenciesPure(
    {
      id: "t3",
      fact_type: "task",
      content: { title: "X", description: "blockiert von etwas anderem" },
    },
    [{ id: "d1", fact_type: "decision", content: { title: "Statik-Freigabe" } }],
  );
  assertEquals(out.length, 0);
});

Deno.test("deadline referenziert decision via Title-Substring → 1 dep wartet_auf", () => {
  const out = detectDependenciesPure(
    {
      id: "dl1",
      fact_type: "deadline",
      content: { title: "Launch nach Statik-Freigabe", due_date: "2026-08-01" },
    },
    [{ id: "dec1", fact_type: "decision", content: { title: "Statik-Freigabe" } }],
  );
  assertEquals(out.length, 1);
  assertEquals(out[0].dependency_type, "wartet_auf");
  assertEquals(out[0].target_id, "dec1");
});

Deno.test("deadline ohne passende decision → 0", () => {
  const out = detectDependenciesPure(
    { id: "dl2", fact_type: "deadline", content: { title: "Launch", due_date: "2026-08-01" } },
    [{ id: "dec1", fact_type: "decision", content: { title: "Andere Sache" } }],
  );
  assertEquals(out.length, 0);
});

Deno.test("reference-Typ wird ignoriert (Kernel macht es)", () => {
  const out = detectDependenciesPure(
    { id: "r1", fact_type: "reference", content: { title: "X", description: "blockiert von Y" } },
    [{ id: "y1", fact_type: "decision", content: { title: "Y-Decision" } }],
  );
  assertEquals(out.length, 0);
});

Deno.test("Self-Match ausgeschlossen", () => {
  const out = detectDependenciesPure(
    { id: "same", fact_type: "task", content: { title: "Foo", description: "blockiert von Foo" } },
    [{ id: "same", fact_type: "task", content: { title: "Foo" } }],
  );
  assertEquals(out.length, 0);
});

Deno.test("kurze Titel (<4) werden ignoriert", () => {
  const out = detectDependenciesPure(
    { id: "t4", fact_type: "task", content: { title: "X", description: "blockiert von ok" } },
    [{ id: "d1", fact_type: "decision", content: { title: "ok" } }],
  );
  assertEquals(out.length, 0);
});
