// =============================================================================
//  commit-fact — HTTP-Adapter (dünn). Kernlogik in ./kernel.ts.
// -----------------------------------------------------------------------------
//  Spezialbehandlung Phase 7.5 dokumentiert in kernel.ts. Hier nur Auth,
//  Body-Parse, Response-Mapping.
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createLogger } from "../_shared/logger.ts";
import { withErrorBoundary } from "../_shared/withErrorBoundary.ts";
import { corsHeaders, handleOptions } from "../_shared/http.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { commitFact } from "./kernel.ts";

// Re-Export für commitFact_test.ts und externe Konsumenten.
export { commitFact } from "./kernel.ts";
export type { CommitFactDeps, CommitFactResult } from "./kernel.ts";

interface Payload {
  review_case_id: string;
  decision: "confirm" | "reject";
  user_decision?: Record<string, unknown> | null;
}

Deno.serve(withErrorBoundary("commit-fact", async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  // deno-lint-ignore no-explicit-any
  const admin: any = createClient(supabaseUrl, serviceKey);

  const auth = await getAuthenticatedUser(req);
  if (!auth.ok) return fail(auth.error, auth.status);
  const user = auth.user;

  const log = createLogger({ fn: "commit-fact", userId: user.id, client: admin });
  log.stage("start", "request received");

  try {
    const payload = (await req.json()) as Payload;
    const result = await commitFact({ admin, user: { id: user.id }, payload, log });
    await log.flush();
    if (result.ok) return ok({ correlation_id: log.correlationId, ...result });
    return new Response(
      JSON.stringify({ ok: false, code: result.code, error: result.error }),
      { status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("commit-fact.error", "commit-fact threw", err);
    await log.flush();
    return fail(msg, 500);
  }
}));

// Lokale ok/fail mit `{ok: true|false, ...}` Body-Shape — bewusst beibehalten,
// FE/AOL-Konsumenten erwarten dieses Envelope. // custom shape, intentional
function ok(payload: unknown) {
  return new Response(JSON.stringify({ ok: true, ...(payload as object) }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function fail(msg: string, status = 500) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
