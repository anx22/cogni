// =============================================================================
//  intake-understand — HTTP-Adapter (dünn). Orchestrierung in ./understandRun.ts.
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createLogger } from "../_shared/logger.ts";
import { withErrorBoundary } from "../_shared/withErrorBoundary.ts";
import { runUnderstand, type UnderstandPayload } from "./understandRun.ts";
import { setStatus } from "./agentBridge.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(
  withErrorBoundary("intake-understand", async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    // deno-lint-ignore no-explicit-any
    const admin: any = createClient(supabaseUrl, serviceKey);
    const log = createLogger({ fn: "intake-understand", client: admin });
    log.stage("start", "request received");

    let asset_id = "";
    try {
      const payload = (await req.json()) as UnderstandPayload;
      asset_id = payload.asset_id ?? "";
      const result = await runUnderstand({ admin, payload, log });
      await log.flush();
      if (result.ok) return ok({ ...result.body, correlation_id: log.correlationId });
      return fail(result.error, result.status);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error("error", msg, err);
      if (asset_id) await setStatus(admin, asset_id, "failed", msg.slice(0, 240));
      await log.flush();
      return fail(msg, 500);
    }
  }),
);

// Lokale ok/fail mit `{ok: true|false, ...}` Body-Shape — bewusst beibehalten,
// FE/intake-trigger erwarten dieses Envelope. // custom shape, intentional
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
