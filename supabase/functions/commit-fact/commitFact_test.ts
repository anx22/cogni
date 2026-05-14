// =============================================================================
//  commit-fact — Pure-Function Tests
// -----------------------------------------------------------------------------
//  Tests die extrahierte `commitFact()` mit mockAdmin. Drei kritische Pfade:
//    1. Happy: confirm → canonical_facts + change_events geschrieben
//    2. NEEDS_ASSIGNMENT: keine Projektzuordnung → strukturiertes 200 mit Code
//    3. Reject: decision=reject → proposed_facts/review_cases auf rejected
// =============================================================================

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { commitFact } from "./index.ts";
import { mockAdmin } from "../_shared/testFixtures.ts";
import type { Logger } from "../_shared/logger.ts";

function silentLog(): Logger {
  // deno-lint-ignore no-explicit-any
  const noop = (..._a: any[]) => {};
  return {
    correlationId: "test",
    bind: noop,
    stage: noop,
    info: noop,
    warn: noop,
    error: noop,
    debug: noop,
    flush: async () => {},
    // deno-lint-ignore no-explicit-any
  } as any;
}

const noopMirror = async () => {};
const noopNotify = async () => {};

Deno.test("commitFact: happy path → canonical_fact + change_event", async () => {
  const admin = mockAdmin({
    "review_cases.select": [{
      data: {
        id: "rc1",
        user_id: "u1",
        session_id: "s1",
        box_type: "fact",
        proposed_fact: {
          id: "pf1",
          fact_type: "stakeholder",
          content: { name: "Alice", role: "PM" },
          delta_type: "add",
          against_fact_id: null,
          source_id: "src1",
          parsed_document_id: null,
          confidence: 0.9,
          extraction_run_id: "run1",
          project_id: null,
        },
        session: { project_id: "p1", metadata: {} },
      },
      error: null,
    }],
    "canonical_facts.insert": [{ data: { id: "cf1" }, error: null }],
  });

  const result = await commitFact({
    admin,
    user: { id: "u1" },
    payload: { review_case_id: "rc1", decision: "confirm" },
    log: silentLog(),
    mirrorFn: noopMirror,
    notifyAolFn: noopNotify,
  });

  assertEquals(result.ok, true);
  if (result.ok) assertEquals(result.canonical_fact_id, "cf1");

  const cfInsert = admin._calls.find((c) => c.table === "canonical_facts" && c.op === "insert");
  assert(cfInsert, "canonical_facts.insert not called");
  assertEquals(cfInsert!.payload.project_id, "p1");
  assertEquals(cfInsert!.payload.fact_type, "stakeholder");

  const ceInsert = admin._calls.find((c) => c.table === "change_events" && c.op === "insert");
  assert(ceInsert, "change_events.insert not called");
  assertEquals(ceInsert!.payload.event_type, "add");
  assertEquals(ceInsert!.payload.canonical_fact_id, "cf1");
});

Deno.test("commitFact: NEEDS_ASSIGNMENT when session has no project + assignment box pending", async () => {
  const admin = mockAdmin({
    "review_cases.select": [
      {
        data: {
          id: "rc2",
          user_id: "u1",
          session_id: "s2",
          box_type: "fact",
          proposed_fact: { id: "pf2", fact_type: "decision", content: {}, delta_type: "add" },
          session: { project_id: null, metadata: {} },
        },
        error: null,
      },
      // Zweiter Aufruf: Assignment-Box-Lookup (.maybeSingle)
      { data: { box_state: "pending" }, error: null },
    ],
  });

  const result = await commitFact({
    admin,
    user: { id: "u1" },
    payload: { review_case_id: "rc2", decision: "confirm" },
    log: silentLog(),
    mirrorFn: noopMirror,
    notifyAolFn: noopNotify,
  });

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.code, "NEEDS_ASSIGNMENT");
    assertEquals(result.status, 200);
  }

  const cfInsert = admin._calls.find((c) => c.table === "canonical_facts" && c.op === "insert");
  assertEquals(cfInsert, undefined, "must not insert canonical_facts when assignment missing");
});

Deno.test("commitFact: reject → proposed_facts + review_cases on rejected, no canonical insert", async () => {
  const admin = mockAdmin({
    "review_cases.select": [{
      data: {
        id: "rc3",
        user_id: "u1",
        session_id: "s3",
        box_type: "fact",
        proposed_fact: {
          id: "pf3",
          fact_type: "stakeholder",
          content: { name: "Bob" },
          delta_type: "add",
        },
        session: { project_id: "p3", metadata: {} },
      },
      error: null,
    }],
  });

  const result = await commitFact({
    admin,
    user: { id: "u1" },
    payload: { review_case_id: "rc3", decision: "reject" },
    log: silentLog(),
    mirrorFn: noopMirror,
    notifyAolFn: noopNotify,
  });

  assertEquals(result.ok, true);

  const pfUpdate = admin._calls.find((c) => c.table === "proposed_facts" && c.op === "update");
  assert(pfUpdate, "proposed_facts.update not called");
  assertEquals(pfUpdate!.payload.status, "rejected");

  const rcUpdate = admin._calls.find((c) => c.table === "review_cases" && c.op === "update");
  assert(rcUpdate, "review_cases.update not called");
  assertEquals(rcUpdate!.payload.box_state, "rejected");

  const cfInsert = admin._calls.find((c) => c.table === "canonical_facts" && c.op === "insert");
  assertEquals(cfInsert, undefined, "must not insert canonical_facts on reject");
});
