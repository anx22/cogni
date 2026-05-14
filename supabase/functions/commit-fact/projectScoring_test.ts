// Deno-Tests für die geteilten reinen Helfer.  Liegt unter commit-fact/, weil
// der Edge-Test-Runner pro Function-Verzeichnis nach *_test.ts sucht.
import { assertEquals, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { scoreProjects, type ProjectContext } from "../_shared/projectScoring.ts";
import { mapToBoxType, segmentsToText } from "../_shared/agentConfig.ts";

const project = (over: Partial<ProjectContext>): ProjectContext => ({
  id: "p1",
  name: "Demo",
  topics: [],
  stakeholders: [],
  org_domains: [],
  ...over,
});

Deno.test("scoreProjects: Projektname trifft mit +3", () => {
  const r = scoreProjects("Heute Update zum Demo-Release", [project({ name: "Demo" })]);
  assertEquals(r[0].score, 3);
  assert(r[0].reasons[0].includes("Demo"));
});

Deno.test("scoreProjects: Stakeholder zählt mit +2 pro Treffer", () => {
  const r = scoreProjects("Mail von Anna und Bob", [
    project({ stakeholders: ["Anna", "Bob"] }),
  ]);
  assertEquals(r[0].score, 4);
});

Deno.test("scoreProjects: Domain zählt mit +1, sortiert absteigend", () => {
  const r = scoreProjects("Anna von acme.com schreibt", [
    project({ id: "p1", name: "Alpha", stakeholders: ["Anna"], org_domains: ["acme.com"] }),
    project({ id: "p2", name: "Beta" }),
  ]);
  assertEquals(r.length, 1);
  assertEquals(r[0].project_id, "p1");
  assertEquals(r[0].score, 3);
});

Deno.test("scoreProjects: ohne Treffer leeres Array", () => {
  const r = scoreProjects("nichts passendes hier", [project({ name: "Demo" })]);
  assertEquals(r.length, 0);
});

Deno.test("scoreProjects: ignoriert sehr kurze Tokens", () => {
  const r = scoreProjects("a b c", [project({ name: "a" })]);
  assertEquals(r.length, 0);
});

Deno.test("mapToBoxType: replace/contradict → conflict", () => {
  assertEquals(mapToBoxType("replace", "decision"), "conflict");
  assertEquals(mapToBoxType("contradict", "stakeholder"), "conflict");
});

Deno.test("mapToBoxType: open_point → gap_box", () => {
  assertEquals(mapToBoxType("add", "open_point"), "gap_box");
});

Deno.test("mapToBoxType: default → knowledge", () => {
  assertEquals(mapToBoxType("add", "stakeholder"), "knowledge");
  assertEquals(mapToBoxType(null, "decision"), "knowledge");
});

Deno.test("segmentsToText: extrahiert Strings + .text-Felder", () => {
  const t = segmentsToText([
    "raw",
    { text: "from-object" },
    { other: "ignored" },
    null,
  ]);
  assertEquals(t, "raw\nfrom-object");
});

Deno.test("segmentsToText: leeres Input → leerer String", () => {
  assertEquals(segmentsToText(null), "");
  assertEquals(segmentsToText("nope"), "");
});
