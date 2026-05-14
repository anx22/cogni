// =============================================================================
//  handleCallback_test.ts
// -----------------------------------------------------------------------------
//  Status-Übergänge von aol-callback ohne HTTP. Nutzt mockAdmin().
// =============================================================================

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { mockAdmin } from "../_shared/testFixtures.ts";
import { handleCallback } from "./index.ts";

function fakeLog() {
  return {
    correlationId: "test-corr",
    stage: () => {},
    bind: () => {},
    warn: () => {},
    error: () => {},
    flush: async () => {},
  };
}

Deno.test("handleCallback: status running schreibt update, kein ended_at", async () => {
  const admin = mockAdmin({
    "aol_runs.update": [{ data: null, error: null }],
    "aol_runs.select": [{ data: { user_id: "u1", asset_id: "a1", project_id: "p1" }, error: null }],
  });
  const res = await handleCallback({
    admin,
    log: fakeLog(),
    payload: { run_id: "r1", status: "running", current_node: "parse" },
  });
  assertEquals(res.ok, true);
  assertEquals(res.status, 200);
  const updateCall = admin._calls.find((c) => c.op === "update");
  assertEquals(updateCall?.payload.status, "running");
  assertEquals(updateCall?.payload.current_node, "parse");
  assertEquals("ended_at" in (updateCall?.payload ?? {}), false);
});

Deno.test("handleCallback: status completed setzt ended_at + facts_written-Metadata", async () => {
  const admin = mockAdmin({
    "aol_runs.update": [{ data: null, error: null }],
    "aol_runs.select": [{ data: null, error: null }],
  });
  const res = await handleCallback({
    admin,
    log: fakeLog(),
    payload: { run_id: "r2", status: "completed", facts_written: 7, session_id: "s9" },
  });
  assertEquals(res.ok, true);
  const updateCall = admin._calls.find((c) => c.op === "update");
  assertEquals(updateCall?.payload.status, "completed");
  assertEquals(typeof updateCall?.payload.ended_at, "string");
  assertEquals(updateCall?.payload.metadata?.facts_written, 7);
  assertEquals(updateCall?.payload.metadata?.session_id, "s9");
});

Deno.test("handleCallback: status failed normalisiert string-error", async () => {
  const admin = mockAdmin({
    "aol_runs.update": [{ data: null, error: null }],
    "aol_runs.select": [{ data: null, error: null }],
  });
  const res = await handleCallback({
    admin,
    log: fakeLog(),
    payload: { run_id: "r3", status: "failed", error: "boom" },
  });
  assertEquals(res.ok, true);
  const updateCall = admin._calls.find((c) => c.op === "update");
  assertEquals(updateCall?.payload.error, { message: "boom" });
  assertEquals(typeof updateCall?.payload.ended_at, "string");
});

Deno.test("handleCallback: leere run_id → 400", async () => {
  const admin = mockAdmin();
  const res = await handleCallback({
    admin,
    log: fakeLog(),
    payload: { run_id: "" },
  });
  assertEquals(res.ok, false);
  assertEquals(res.status, 400);
});

Deno.test("handleCallback: aol_runs update-Fehler → 500", async () => {
  const admin = mockAdmin({
    "aol_runs.update": [{ data: null, error: { message: "db down" } }],
  });
  const res = await handleCallback({
    admin,
    log: fakeLog(),
    payload: { run_id: "r4", status: "running" },
  });
  assertEquals(res.ok, false);
  assertEquals(res.status, 500);
});
