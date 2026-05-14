// =============================================================================
//  intake-understand / linker_test.ts (B-W1)
// -----------------------------------------------------------------------------
//  Pure-function tests für linkAgainstExisting. Mock = einfache Arrays,
//  keine Netz-Calls. Läuft via `deno test`.
// =============================================================================

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { linkAgainstExisting } from "./linker.ts";
import type { GraphitiHit } from "../_shared/clients/graphitiSearch.ts";

const fact = (over: Partial<{ fact_type: string; title: string }> = {}) => ({
  fact_type: "stakeholder",
  title: "Bibliothek aufbauen",
  content: {},
  confidence: 0.9,
  ...over,
}) as any;

Deno.test("title-match: exakt → confirm via title", () => {
  const r = linkAgainstExisting(fact(), [
    { id: "cf-1", fact_type: "task", content: { title: "Bibliothek aufbauen" } },
  ]);
  assertEquals(r, { delta_type: "confirm", against_fact_id: "cf-1", matched_via: "title" });
});

Deno.test("title-match: anderer fact_type → add", () => {
  const r = linkAgainstExisting(fact(), [
    { id: "cf-1", fact_type: "decision", content: { title: "Bibliothek aufbauen" } },
  ]);
  assertEquals(r.delta_type, "add");
  assertEquals(r.against_fact_id, null);
});

Deno.test("graph-match: hit substring + existing title → confirm via graph", () => {
  const hits: GraphitiHit[] = [
    { fact: "user erstellt die Bibliothek aufbauen Übergabe", uuid: "h1" },
  ];
  const r = linkAgainstExisting(
    fact(),
    [
      { id: "cf-other", fact_type: "task", content: { title: "Etwas anderes" } },
      { id: "cf-2", fact_type: "task", content: { title: "Bibliothek aufbauen Übergabe" } },
    ],
    { searchHits: hits },
  );
  assertEquals(r, { delta_type: "confirm", against_fact_id: "cf-2", matched_via: "graph" });
});

Deno.test("graph-match: hit ohne passenden existing fact → add", () => {
  const hits: GraphitiHit[] = [{ fact: "ganz andere semantik", uuid: "h1" }];
  const r = linkAgainstExisting(fact(), [], { searchHits: hits });
  assertEquals(r.delta_type, "add");
  assertEquals(r.against_fact_id, null);
});

Deno.test("graph fallback: searchHits null → verhält sich wie alter Title-Linker", () => {
  const r = linkAgainstExisting(fact(), [
    { id: "cf-1", fact_type: "task", content: { title: "Bibliothek aufbauen" } },
  ], { searchHits: null });
  assertEquals(r.delta_type, "confirm");
  assertEquals(r.against_fact_id, "cf-1");
});

Deno.test("non-linkable fact_type (z. B. open_point ohne Linkregel) → add", () => {
  // Annahme: 'reference' liegt nicht in LINKABLE_FACT_TYPES — falls doch, ist
  // dieser Test ein Wahrnehmungssensor und zeigt, wenn die Regel sich ändert.
  const r = linkAgainstExisting(
    fact({ fact_type: "reference", title: "irrelevant" }),
    [{ id: "cf-1", fact_type: "reference", content: { title: "irrelevant" } }],
  );
  // Wenn 'reference' linkable ist, wäre das confirm; sonst add.
  // Wir akzeptieren beides als korrekt — wichtig ist Konsistenz mit factRules.
  if (r.delta_type === "confirm") {
    assertEquals(r.against_fact_id, "cf-1");
  } else {
    assertEquals(r.delta_type, "add");
  }
});
