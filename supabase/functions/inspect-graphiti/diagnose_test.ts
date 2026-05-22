// =============================================================================
//  inspect-graphiti / diagnose — Pure-Function Tests.
// =============================================================================
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { groupFailedReasons, normalizeReason } from "./diagnose.ts";

Deno.test("normalizeReason: null/empty → Platzhalter", () => {
  assertEquals(normalizeReason(null), "(kein Fehlertext)");
  assertEquals(normalizeReason(""), "(kein Fehlertext)");
  assertEquals(normalizeReason("   "), "(leer)");
});

Deno.test("normalizeReason: maskiert UUIDs", () => {
  const e = "graphiti error for 550e8400-e29b-41d4-a716-446655440000 endpoint";
  assertEquals(normalizeReason(e), "graphiti error for <uuid> endpoint");
});

Deno.test("normalizeReason: maskiert lange Zahlen (status, ports)", () => {
  const e = "POST /add_episodes failed with status 502 (response 14237 bytes)";
  // 502 hat 3 Stellen → maskiert. "POST" + "/add_episodes" bleibt.
  const out = normalizeReason(e);
  assertEquals(out.includes("<n>"), true);
  assertEquals(out.includes("502"), false);
});

Deno.test("normalizeReason: nimmt nur erste Zeile + kürzt auf 80", () => {
  const e = "first line of error\nstack trace line 1\nstack trace line 2";
  assertEquals(normalizeReason(e), "first line of error");
  const long = "a".repeat(200);
  assertEquals(normalizeReason(long).length, 80);
});

Deno.test("groupFailedReasons: gleiche normalisierte Reason → 1 Gruppe mit count", () => {
  const rows = [
    {
      id: "1",
      entity_type: "fact",
      entity_id: "f1",
      error: "graphiti add_episodes failed for 550e8400-e29b-41d4-a716-446655440000",
      created_at: "2026-05-20T10:00:00Z",
    },
    {
      id: "2",
      entity_type: "fact",
      entity_id: "f2",
      error: "graphiti add_episodes failed for 660e8400-e29b-41d4-a716-446655440001",
      created_at: "2026-05-20T11:00:00Z",
    },
  ];
  const out = groupFailedReasons(rows);
  assertEquals(out.length, 1);
  assertEquals(out[0].count, 2);
  // latest_at = 11:00 → sample.entity_id = f2 (zugehörig)
  assertEquals(out[0].sample_entity_id, "f2");
  assertEquals(out[0].latest_at, "2026-05-20T11:00:00Z");
});

Deno.test("groupFailedReasons: sortiert nach count desc, dann reason asc", () => {
  const rows = [
    {
      id: "1",
      entity_type: "x",
      entity_id: "1",
      error: "alpha",
      created_at: "2026-05-20T10:00:00Z",
    },
    {
      id: "2",
      entity_type: "x",
      entity_id: "2",
      error: "beta",
      created_at: "2026-05-20T10:00:00Z",
    },
    {
      id: "3",
      entity_type: "x",
      entity_id: "3",
      error: "beta",
      created_at: "2026-05-20T10:00:00Z",
    },
  ];
  const out = groupFailedReasons(rows);
  assertEquals(out.length, 2);
  assertEquals(out[0].reason, "beta"); // count 2
  assertEquals(out[1].reason, "alpha"); // count 1
});

Deno.test("groupFailedReasons: leere Eingabe → leere Liste", () => {
  assertEquals(groupFailedReasons([]).length, 0);
});
