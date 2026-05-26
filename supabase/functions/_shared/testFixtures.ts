// =============================================================================
//  Test-Fixtures — gemeinsame Helfer für Integration-Smokes
// -----------------------------------------------------------------------------
//  Konvention: ALLES, was Tests in der DB anlegen, bekommt einen Marker
//  `metadata.test_run_id = <uuid>`. Die Edge Function `test-data-sweep`
//  räumt nach Lauf bzw. nightly alles weg, was älter als 1h ist.
//
//  Benutzung in Deno-Tests:
//    const ctx = await seedAsset(admin, { user_id, label: "happy" });
//    ...
//    await sweepTestRun(admin, ctx.test_run_id);
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const TEST_USER_EMAIL = "test+qa@produktintelligenz.local";
export const TEST_PROJECT_SLUG = "qa-fixtures";

export interface FixtureContext {
  test_run_id: string;
  user_id: string;
  project_id?: string;
  asset_id?: string;
  parsed_document_id?: string;
  proposed_fact_id?: string;
  canonical_fact_id?: string;
  session_id?: string;
}

export function adminClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

export function newTestRunId(): string {
  return crypto.randomUUID();
}

function marker(test_run_id: string, extra: Record<string, unknown> = {}) {
  return { test_run_id, _origin: "qa-fixture", ...extra };
}

export async function ensureProject(
  admin: any,
  user_id: string,
  test_run_id: string,
  name = "QA Fixture Project",
): Promise<string> {
  const { data, error } = await admin
    .from("projects")
    .insert({ user_id, name, metadata: marker(test_run_id) })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function seedAsset(
  admin: any,
  opts: {
    user_id: string;
    project_id?: string;
    test_run_id?: string;
    label?: string;
    kind?: string;
  },
): Promise<FixtureContext> {
  const test_run_id = opts.test_run_id ?? newTestRunId();
  const { data, error } = await admin
    .from("assets")
    .insert({
      user_id: opts.user_id,
      project_id: opts.project_id ?? null,
      label: opts.label ?? "qa-fixture-asset",
      kind: opts.kind ?? "note",
      metadata: marker(test_run_id, { label: opts.label ?? null }),
    })
    .select("id")
    .single();
  if (error) throw error;
  return {
    test_run_id,
    user_id: opts.user_id,
    project_id: opts.project_id,
    asset_id: data.id,
  };
}

export async function seedProposedFact(
  admin: any,
  ctx: FixtureContext,
  fact: {
    fact_type: string;
    content: Record<string, unknown>;
    delta_type?: string | null;
  },
): Promise<string> {
  const { data, error } = await admin
    .from("proposed_facts")
    .insert({
      user_id: ctx.user_id,
      project_id: ctx.project_id ?? null,
      asset_id: ctx.asset_id,
      fact_type: fact.fact_type,
      content: fact.content,
      delta_type: fact.delta_type ?? "add",
      status: "pending",
      metadata: marker(ctx.test_run_id),
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

/**
 * Räumt alle Daten mit dem gegebenen test_run_id-Marker auf.
 * Genutzt am Ende einzelner Tests; der nightly Sweeper deckt Vergessenes ab.
 */
export async function sweepTestRun(admin: any, test_run_id: string) {
  const tables = [
    "change_events",
    "canonical_facts",
    "review_cases",
    "proposed_facts",
    "dialog_sessions",
    "parsed_documents",
    "aol_runs",
    "assets",
    "projects",
    "pipeline_events",
  ];
  const results: Record<string, number> = {};
  for (const t of tables) {
    const { error, count } = await admin
      .from(t)
      .delete({ count: "exact" })
      .filter("metadata->>test_run_id", "eq", test_run_id);
    results[t] = count ?? 0;
    if (error && !/column .* does not exist/i.test(error.message)) {
      console.warn(`sweepTestRun(${t}): ${error.message}`);
    }
  }
  return results;
}

// =============================================================================
//  Mock-Admin — In-Memory-Stub für Supabase-Client (Unit-Tests)
// -----------------------------------------------------------------------------
//  Konvention: Stub-Antworten werden pro `${table}.${op}` als Queue hinterlegt
//  und in Aufrufreihenfolge zurückgegeben. Default `{ data: null, error: null }`.
//  Erfasst alle Calls in `_calls` für Assertions.
// =============================================================================

// deno-lint-ignore no-explicit-any
export type MockResponse = { data?: any; error?: any; count?: number };

export interface MockAdmin {
  // deno-lint-ignore no-explicit-any
  from: (t: string) => any;
  // deno-lint-ignore no-explicit-any
  _calls: Array<{ table: string; op: string; payload?: any }>;
}

export function mockAdmin(stubs: Record<string, MockResponse[]> = {}): MockAdmin {
  // deno-lint-ignore no-explicit-any
  const calls: Array<{ table: string; op: string; payload?: any }> = [];

  function builder(table: string) {
    let op = "select";
    // deno-lint-ignore no-explicit-any
    let payload: any = undefined;
    // deno-lint-ignore no-explicit-any
    const b: any = {};
    // deno-lint-ignore no-explicit-any
    b.select = (..._a: any[]) => {
      return b;
    };
    // deno-lint-ignore no-explicit-any
    b.insert = (p: any) => {
      op = "insert";
      payload = p;
      return b;
    };
    // deno-lint-ignore no-explicit-any
    b.update = (p: any) => {
      op = "update";
      payload = p;
      return b;
    };
    b.delete = () => {
      op = "delete";
      return b;
    };
    // deno-lint-ignore no-explicit-any
    b.eq = (..._a: any[]) => b;
    // deno-lint-ignore no-explicit-any
    b.in = (..._a: any[]) => b;
    // deno-lint-ignore no-explicit-any
    b.neq = (..._a: any[]) => b;
    // deno-lint-ignore no-explicit-any
    b.filter = (..._a: any[]) => b;
    // deno-lint-ignore no-explicit-any
    b.order = (..._a: any[]) => b;
    // deno-lint-ignore no-explicit-any
    b.limit = (..._a: any[]) => b;

    const finalize = async (): Promise<MockResponse> => {
      calls.push({ table, op, payload });
      const key = `${table}.${op}`;
      const list = stubs[key];
      if (list && list.length > 0) return list.shift()!;
      return { data: null, error: null, count: 0 };
    };
    b.single = () => finalize();
    b.maybeSingle = () => finalize();
    // deno-lint-ignore no-explicit-any
    b.then = (res: any, rej: any) => finalize().then(res, rej);
    return b;
  }

  return { from: builder, _calls: calls };
}
