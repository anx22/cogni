// =============================================================================
//  topicMergeDetector — Pure-Function Tests (P1-B4)
// =============================================================================
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { detectTopicMergesPure } from "./topicMergeDetector.ts";

Deno.test("exact name match → 1 candidate", () => {
  const fresh = { id: "new", canonical_fact_id: "cf-new", name: "Markenarchitektur" };
  const others = [{ id: "old1", canonical_fact_id: "cf1", name: "markenarchitektur" }];
  const out = detectTopicMergesPure(fresh, others);
  assertEquals(out.length, 1);
  assertEquals(out[0].source_topic_id, "new");
  assertEquals(out[0].target_topic_id, "old1");
});

Deno.test("substring token match → candidate", () => {
  const fresh = { id: "new", canonical_fact_id: "cf-new", name: "Reels Strategie" };
  const others = [{ id: "old1", canonical_fact_id: "cf1", name: "Instagram Reels Q3" }];
  const out = detectTopicMergesPure(fresh, others);
  assertEquals(out.length, 1);
});

Deno.test("no token overlap → no candidate", () => {
  const fresh = { id: "new", canonical_fact_id: "cf-new", name: "Onboarding" };
  const others = [{ id: "old1", canonical_fact_id: "cf1", name: "Pricing" }];
  assertEquals(detectTopicMergesPure(fresh, others).length, 0);
});

Deno.test("self-row excluded", () => {
  const fresh = { id: "same", canonical_fact_id: "cf", name: "Strategie" };
  const others = [{ id: "same", canonical_fact_id: "cf", name: "Strategie" }];
  assertEquals(detectTopicMergesPure(fresh, others).length, 0);
});

Deno.test("empty name → no candidate", () => {
  const fresh = { id: "new", canonical_fact_id: "cf-new", name: "" };
  const others = [{ id: "old1", canonical_fact_id: "cf1", name: "Strategie" }];
  assertEquals(detectTopicMergesPure(fresh, others).length, 0);
});

Deno.test("token < min length → ignored", () => {
  // "und" (3 Zeichen) ist zu kurz → kein Match nur über Stop-Tokens.
  const fresh = { id: "new", canonical_fact_id: "cf-new", name: "Und Mehr" };
  const others = [{ id: "old1", canonical_fact_id: "cf1", name: "Und Anderes" }];
  // "mehr" (4 Zeichen) ist Token; aber kommt nicht in "und anderes" vor.
  // "und" wird verworfen. Erwartet: kein Match.
  assertEquals(detectTopicMergesPure(fresh, others).length, 0);
});

Deno.test("multiple candidates for one fresh topic", () => {
  const fresh = {
    id: "new",
    canonical_fact_id: "cf-new",
    name: "Content Strategie 2026",
  };
  const others = [
    { id: "a", canonical_fact_id: "cfa", name: "Content Marketing" },
    { id: "b", canonical_fact_id: "cfb", name: "Strategie Q1" },
    { id: "c", canonical_fact_id: "cfc", name: "Pricing" },
  ];
  const out = detectTopicMergesPure(fresh, others);
  assertEquals(out.length, 2);
  assertEquals(out.map((d) => d.target_topic_id).sort(), ["a", "b"]);
});

Deno.test("punctuation and separators tokenized", () => {
  const fresh = {
    id: "new",
    canonical_fact_id: "cf-new",
    name: "Hose & Söhne — Couture",
  };
  const others = [{ id: "old1", canonical_fact_id: "cf1", name: "Couture Kollektion" }];
  assertEquals(detectTopicMergesPure(fresh, others).length, 1);
});
