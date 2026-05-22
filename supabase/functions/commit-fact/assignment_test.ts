// =============================================================================
//  commit-fact / assignment_test.ts
// -----------------------------------------------------------------------------
//  Unit tests for handleAssignment using mockAdmin.
//  Covers the 4 confirm branches + reject path.
// =============================================================================

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handleAssignment } from "./assignment.ts";
import { mockAdmin } from "../_shared/testFixtures.ts";

function makeRc(over: Record<string, unknown> = {}) {
  return {
    id: "rc-1",
    session_id: "sess-1",
    context: {},
    session: { metadata: {} },
    ...over,
  };
}

Deno.test("reject → review_case.box_state=rejected, kein Projekt-Update", async () => {
  const admin = mockAdmin();
  await handleAssignment(admin, "u1", makeRc(), "reject");
  const rcUpdate = admin._calls.find((c) => c.table === "review_cases" && c.op === "update");
  assert(rcUpdate, "review_cases.update not called");
  assertEquals(rcUpdate!.payload.box_state, "rejected");
  const dsUpdate = admin._calls.find((c) => c.table === "dialog_sessions" && c.op === "update");
  assertEquals(dsUpdate, undefined, "dialog_sessions must not be updated on reject");
});

Deno.test("confirm mit user_decision.project_id → nimmt dieses Projekt", async () => {
  const admin = mockAdmin({
    "projects.insert": [{ data: { id: "new-p" }, error: null }],
  });
  const rc = makeRc();
  await handleAssignment(admin, "u1", rc, "confirm", { project_id: "chosen-p" });
  const dsUpdate = admin._calls.find((c) => c.table === "dialog_sessions" && c.op === "update");
  assert(dsUpdate, "dialog_sessions.update not called");
  assertEquals(dsUpdate!.payload.project_id, "chosen-p");
  const rcUpdate = admin._calls.find((c) => c.table === "review_cases" && c.op === "update");
  assertEquals(rcUpdate!.payload.box_state, "confirmed");
  assertEquals(rcUpdate!.payload.user_decision.project_id, "chosen-p");
});

Deno.test("confirm mit user_decision.new_project_name → erstellt neues Projekt", async () => {
  const admin = mockAdmin({
    "projects.insert": [{ data: { id: "brand-new" }, error: null }],
  });
  const rc = makeRc();
  await handleAssignment(admin, "u1", rc, "confirm", { new_project_name: "Neues Projekt" });
  const pInsert = admin._calls.find((c) => c.table === "projects" && c.op === "insert");
  assert(pInsert, "projects.insert not called");
  assertEquals(pInsert!.payload.name, "Neues Projekt");
  const dsUpdate = admin._calls.find((c) => c.table === "dialog_sessions" && c.op === "update");
  assertEquals(dsUpdate!.payload.project_id, "brand-new");
});

Deno.test("confirm mit assignment_mode=auto → nimmt first candidate", async () => {
  const admin = mockAdmin();
  const rc = makeRc({
    context: {
      assignment_mode: "auto",
      candidates: [{ project_id: "auto-p" }],
    },
  });
  await handleAssignment(admin, "u1", rc, "confirm");
  const dsUpdate = admin._calls.find((c) => c.table === "dialog_sessions" && c.op === "update");
  assertEquals(dsUpdate!.payload.project_id, "auto-p");
});

Deno.test("confirm mit assignment_mode=new + suggested_new_name → erstellt Projekt", async () => {
  const admin = mockAdmin({
    "projects.insert": [{ data: { id: "suggested-p" }, error: null }],
  });
  const rc = makeRc({
    context: {
      assignment_mode: "new",
      suggested_new_name: "Vorgeschlagenes Projekt",
    },
  });
  await handleAssignment(admin, "u1", rc, "confirm");
  const pInsert = admin._calls.find((c) => c.table === "projects" && c.op === "insert");
  assert(pInsert, "projects.insert not called");
  assertEquals(pInsert!.payload.name, "Vorgeschlagenes Projekt");
  const dsUpdate = admin._calls.find((c) => c.table === "dialog_sessions" && c.op === "update");
  assertEquals(dsUpdate!.payload.project_id, "suggested-p");
});

Deno.test("confirm mit asset_id → assets.update auf chosenProjectId", async () => {
  const admin = mockAdmin();
  const rc = makeRc({
    context: {
      assignment_mode: "auto",
      candidates: [{ project_id: "p-asset" }],
      asset_id: "asset-42",
    },
  });
  await handleAssignment(admin, "u1", rc, "confirm");
  const assetUpdate = admin._calls.find((c) => c.table === "assets" && c.op === "update");
  assert(assetUpdate, "assets.update not called");
  assertEquals(assetUpdate!.payload.project_id, "p-asset");
});

Deno.test("confirm mit extraction_run_id → proposed_facts.update auf chosenProjectId", async () => {
  const admin = mockAdmin();
  const rc = makeRc({
    context: { assignment_mode: "auto", candidates: [{ project_id: "p-run" }] },
    session: { metadata: { extraction_run_id: "run-xyz" } },
  });
  await handleAssignment(admin, "u1", rc, "confirm");
  const pfUpdate = admin._calls.find((c) => c.table === "proposed_facts" && c.op === "update");
  assert(pfUpdate, "proposed_facts.update not called");
  assertEquals(pfUpdate!.payload.project_id, "p-run");
});
