// =============================================================================
//  graphiti-reconcile / retryFilter_test — pure tests
// =============================================================================
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { selectRetryCandidates, type FailedSyncRow } from "./retryFilter.ts";

const NOW = new Date("2026-05-22T18:00:00Z");

const row = (over: Partial<FailedSyncRow> = {}): FailedSyncRow => ({
  entity_id: "cf-1",
  attempt: 0,
  error: "Graphiti 502: bad gateway",
  last_retry_at: null,
  ...over,
});

Deno.test("attempt < max_attempts und kein last_retry_at → eligible", () => {
  const out = selectRetryCandidates([row()], { now: NOW });
  assertEquals(out.eligible.length, 1);
  assertEquals(out.skipped_by_attempt, 0);
});

Deno.test("attempt >= max_attempts → skip (permanent fail)", () => {
  const out = selectRetryCandidates([row({ attempt: 3 })], { max_attempts: 3, now: NOW });
  assertEquals(out.eligible.length, 0);
  assertEquals(out.skipped_by_attempt, 1);
});

Deno.test("attempt null → wird wie 0 behandelt → eligible", () => {
  const out = selectRetryCandidates([row({ attempt: null })], { now: NOW });
  assertEquals(out.eligible.length, 1);
});

Deno.test("last_retry_at innerhalb Cooldown → skip", () => {
  const lastTry = new Date(NOW.getTime() - 10 * 60_000).toISOString(); // 10 min her
  const out = selectRetryCandidates([row({ last_retry_at: lastTry })], {
    retry_cooldown_min: 30,
    now: NOW,
  });
  assertEquals(out.eligible.length, 0);
  assertEquals(out.skipped_by_cooldown, 1);
});

Deno.test("last_retry_at vor Cooldown → eligible", () => {
  const lastTry = new Date(NOW.getTime() - 45 * 60_000).toISOString(); // 45 min her
  const out = selectRetryCandidates([row({ last_retry_at: lastTry })], {
    retry_cooldown_min: 30,
    now: NOW,
  });
  assertEquals(out.eligible.length, 1);
});

Deno.test("failed_reason_filter Substring-Match (case-insensitive) → eligible", () => {
  const out = selectRetryCandidates(
    [row({ error: "Graphiti 502: bad gateway" }), row({ error: "client offline" })],
    { failed_reason_filter: "502", now: NOW },
  );
  assertEquals(out.eligible.length, 1);
  assertEquals(out.skipped_by_reason, 1);
});

Deno.test("failed_reason_filter ohne Match → alle skipped_by_reason", () => {
  const out = selectRetryCandidates([row({ error: "Graphiti 502" }), row({ error: "timeout" })], {
    failed_reason_filter: "noSuchReason",
    now: NOW,
  });
  assertEquals(out.eligible.length, 0);
  assertEquals(out.skipped_by_reason, 2);
});

Deno.test("kombiniert: attempt + cooldown + reason → korrekte Zählung", () => {
  const lastTry = new Date(NOW.getTime() - 5 * 60_000).toISOString();
  const out = selectRetryCandidates(
    [
      row({ entity_id: "a", attempt: 0, error: "Graphiti 502" }), // eligible
      row({ entity_id: "b", attempt: 3, error: "Graphiti 502" }), // skip attempt
      row({ entity_id: "c", attempt: 0, error: "Graphiti 502", last_retry_at: lastTry }), // skip cooldown
      row({ entity_id: "d", attempt: 0, error: "timeout" }), // skip reason
    ],
    { max_attempts: 3, retry_cooldown_min: 30, failed_reason_filter: "502", now: NOW },
  );
  assertEquals(out.eligible.length, 1);
  assertEquals(out.eligible[0].entity_id, "a");
  assertEquals(out.skipped_by_attempt, 1);
  assertEquals(out.skipped_by_cooldown, 1);
  assertEquals(out.skipped_by_reason, 1);
});

Deno.test("leere Eingabe → leeres Ergebnis", () => {
  const out = selectRetryCandidates([], { now: NOW });
  assertEquals(out.eligible.length, 0);
});

Deno.test("failed_reason_filter mit whitespace trim", () => {
  const out = selectRetryCandidates([row({ error: "Graphiti 502" })], {
    failed_reason_filter: "  502  ",
    now: NOW,
  });
  assertEquals(out.eligible.length, 1);
});
