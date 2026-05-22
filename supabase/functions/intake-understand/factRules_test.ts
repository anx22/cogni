// =============================================================================
//  intake-understand / factRules_test.ts
// -----------------------------------------------------------------------------
//  Pure-function tests for summarizeFact + LINKABLE_FACT_TYPES.
//  No network calls — runs via `deno test`.
// =============================================================================

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { summarizeFact, LINKABLE_FACT_TYPES } from "./factRules.ts";

// --- LINKABLE_FACT_TYPES -----------------------------------------------

Deno.test("LINKABLE_FACT_TYPES enthält stakeholder und topic", () => {
  assert(LINKABLE_FACT_TYPES.has("stakeholder"));
  assert(LINKABLE_FACT_TYPES.has("topic"));
});

Deno.test("LINKABLE_FACT_TYPES schließt decision/deadline/task aus", () => {
  assert(!LINKABLE_FACT_TYPES.has("decision"));
  assert(!LINKABLE_FACT_TYPES.has("deadline"));
  assert(!LINKABLE_FACT_TYPES.has("task"));
});

// --- summarizeFact -------------------------------------------------------

Deno.test("stakeholder: name · (role) · org · email", () => {
  const out = summarizeFact("stakeholder", {
    name: "Alice",
    role: "PM",
    organization: "Cogni GmbH",
    email: "alice@example.com",
  });
  assertEquals(out, "Alice · (PM) · Cogni GmbH · alice@example.com");
});

Deno.test("stakeholder: nur name → kein trailing ·", () => {
  const out = summarizeFact("stakeholder", { name: "Bob" });
  assertEquals(out, "Bob");
});

Deno.test("decision: zieht decision-Feld bevorzugt", () => {
  const out = summarizeFact("decision", { decision: "PostgreSQL verwenden", title: "DB-Wahl" });
  assertEquals(out, "PostgreSQL verwenden");
});

Deno.test("decision: fällt auf title zurück", () => {
  const out = summarizeFact("decision", { title: "DB-Wahl" });
  assertEquals(out, "DB-Wahl");
});

Deno.test("task: zieht task-Feld", () => {
  const out = summarizeFact("task", { task: "Doku schreiben", title: "X" });
  assertEquals(out, "Doku schreiben");
});

Deno.test("deadline: what + when", () => {
  const out = summarizeFact("deadline", { what: "Launch", when: "2026-06-01" });
  assertEquals(out, "Launch — 2026-06-01");
});

Deno.test("deadline: title + due_date als Fallback", () => {
  const out = summarizeFact("deadline", { title: "Go-Live", due_date: "2026-07-01" });
  assertEquals(out, "Go-Live — 2026-07-01");
});

Deno.test("deadline: ohne Datum nur Titel", () => {
  const out = summarizeFact("deadline", { title: "Meilenstein" });
  assertEquals(out, "Meilenstein");
});

Deno.test("topic: zieht topic-Feld", () => {
  const out = summarizeFact("topic", { topic: "Performance", title: "X" });
  assertEquals(out, "Performance");
});

Deno.test("open_point: zieht title", () => {
  const out = summarizeFact("open_point", { title: "Welche Farbe?", question: "Y" });
  assertEquals(out, "Welche Farbe?");
});

Deno.test("open_point: fällt auf question zurück", () => {
  const out = summarizeFact("open_point", { question: "Wann Lieferung?" });
  assertEquals(out, "Wann Lieferung?");
});

Deno.test("reference: description bevorzugt", () => {
  const out = summarizeFact("reference", { description: "DIN 1234", title: "X" });
  assertEquals(out, "DIN 1234");
});

Deno.test("unknown fact_type: fällt auf title/summary zurück", () => {
  const out = summarizeFact("custom_type", { title: "Benutzerdefiniert" });
  assertEquals(out, "Benutzerdefiniert");
});

Deno.test("unknown fact_type ohne title/summary → leerer String", () => {
  const out = summarizeFact("custom_type", { someField: "x" });
  assertEquals(out, "");
});
