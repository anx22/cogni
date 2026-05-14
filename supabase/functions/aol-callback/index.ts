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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CallbackPayload {
  run_id: string;
  status?: "running" | "completed" | "failed";
  current_node?: string;
  error?: { message: string; where?: string } | string;
  facts_written?: number;
  session_id?: string | null;
  metadata?: Record<string, unknown>;
}

Deno.serve(withErrorBoundary("aol-callback", async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // --- Auth: shared secret zwischen Railway und Lovable Cloud ---------------
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
    const body = (await req.json()) as CallbackPayload;
    if (!body.run_id) throw new Error("run_id fehlt");
    log.bind({ runId: body.run_id });
    log.stage("input", "payload parsed", {
      status: body.status,
      current_node: body.current_node,
      facts_written: body.facts_written,
    });

    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (body.status) update.status = body.status;
    if (body.current_node) update.current_node = body.current_node;
    if (body.error !== undefined) {
      update.error =
        typeof body.error === "string" ? { message: body.error } : body.error;
    }
    if (body.status === "completed" || body.status === "failed") {
      update.ended_at = new Date().toISOString();
    }
    if (body.metadata || body.facts_written !== undefined || body.session_id) {
      update.metadata = {
        ...(body.metadata ?? {}),
        ...(body.facts_written !== undefined
          ? { facts_written: body.facts_written }
          : {}),
        ...(body.session_id ? { session_id: body.session_id } : {}),
      };
    }

    const { error } = await admin
      .from("aol_runs")
      .update(update)
      .eq("id", body.run_id);
    if (error) throw new Error(`aol_runs update: ${error.message}`);

    // user_id für RLS-konformen Pipeline-Event-Eintrag nachladen
    const { data: runRow } = await admin
      .from("aol_runs")
      .select("user_id, asset_id, project_id")
      .eq("id", body.run_id)
      .maybeSingle();
    if (runRow) log.bind({ userId: runRow.user_id, assetId: runRow.asset_id, projectId: runRow.project_id });

    log.stage("done", "aol_run updated", { status: body.status });
    await log.flush();
    return ok({ run_id: body.run_id, correlation_id: log.correlationId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("error", msg, err);
    await log.flush();
    return fail(msg, 400);
  }
}));

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
