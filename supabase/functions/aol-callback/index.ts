// =============================================================================
//  aol-callback
// -----------------------------------------------------------------------------
//  Sicherer Rückkanal vom Railway-AOL-Service in die Lovable-Cloud-DB.
//  Statt Railway den SUPABASE_SERVICE_ROLE_KEY zu geben, ruft der AOL-Service
//  diese Funktion mit Bearer AOL_CALLBACK_TOKEN auf. Hier wird mit dem intern
//  verfügbaren Service-Role-Key in die Tabellen geschrieben.
//
//  Body:
//  {
//    run_id: string,                 // aol_runs.id
//    status?: "running" | "completed" | "failed",
//    current_node?: string,
//    error?: { message: string, where?: string } | string,
//    facts_written?: number,
//    session_id?: string | null,
//    metadata?: Record<string, unknown>
//  }
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createLogger } from "../_shared/logger.ts";
import { withErrorBoundary } from "../_shared/withErrorBoundary.ts";
import { corsHeaders, handleOptions } from "../_shared/http.ts";

export interface CallbackPayload {
  run_id: string;
  status?: "running" | "completed" | "failed";
  current_node?: string;
  error?: { message: string; where?: string } | string;
  facts_written?: number;
  session_id?: string | null;
  metadata?: Record<string, unknown>;
}

export type AolAdmin = {
  // deno-lint-ignore no-explicit-any
  from: (t: string) => any;
};

export interface HandleCallbackResult {
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
}

/**
 * Pure Logik des aol-callback Endpoints — testbar ohne HTTP.
 * Auth-Check + Payload-Validation + aol_runs-Update.
 */
export async function handleCallback(opts: {
  admin: AolAdmin;
  payload: CallbackPayload;
  // deno-lint-ignore no-explicit-any
  log: any;
}): Promise<HandleCallbackResult> {
  const { admin, payload, log } = opts;
  if (!payload.run_id) {
    log.warn("input", "run_id missing");
    return { ok: false, status: 400, body: { error: "run_id fehlt" } };
  }
  log.bind({ runId: payload.run_id });
  log.stage("input", "payload parsed", {
    status: payload.status,
    current_node: payload.current_node,
    facts_written: payload.facts_written,
  });

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (payload.status) update.status = payload.status;
  if (payload.current_node) update.current_node = payload.current_node;
  if (payload.error !== undefined) {
    update.error =
      typeof payload.error === "string" ? { message: payload.error } : payload.error;
  }
  if (payload.status === "completed" || payload.status === "failed") {
    update.ended_at = new Date().toISOString();
  }
  if (payload.metadata || payload.facts_written !== undefined || payload.session_id) {
    update.metadata = {
      ...(payload.metadata ?? {}),
      ...(payload.facts_written !== undefined
        ? { facts_written: payload.facts_written }
        : {}),
      ...(payload.session_id ? { session_id: payload.session_id } : {}),
    };
  }

  const { error } = await admin
    .from("aol_runs")
    .update(update)
    .eq("id", payload.run_id);
  if (error) {
    log.error("update", "aol_runs update failed", error);
    return { ok: false, status: 500, body: { error: `aol_runs update: ${error.message}` } };
  }

  const { data: runRow } = await admin
    .from("aol_runs")
    .select("user_id, asset_id, project_id")
    .eq("id", payload.run_id)
    .maybeSingle();
  if (runRow) {
    log.bind({
      userId: runRow.user_id,
      assetId: runRow.asset_id,
      projectId: runRow.project_id,
    });
  }

  log.stage("done", "aol_run updated", { status: payload.status });
  return {
    ok: true,
    status: 200,
    body: { run_id: payload.run_id, correlation_id: log.correlationId },
  };
}

Deno.serve(withErrorBoundary("aol-callback", async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;

  const expected = Deno.env.get("AOL_CALLBACK_TOKEN") ?? "";
  if (!expected) return fail("AOL_CALLBACK_TOKEN nicht konfiguriert", 500);

  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${expected}`) {
    return fail("unauthorized", 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);
  const log = createLogger({ fn: "aol-callback", client: admin });
  log.stage("start", "callback received");

  try {
    const payload = (await req.json()) as CallbackPayload;
    const res = await handleCallback({ admin, payload, log });
    await log.flush();
    return new Response(JSON.stringify(res.ok ? { ok: true, ...res.body } : { ok: false, ...res.body }), {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("error", msg, err);
    await log.flush();
    return fail(msg, 400);
  }
}));

// Lokales fail mit `{ok: false, error}` Envelope. // custom shape, intentional
function fail(msg: string, status = 500) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
