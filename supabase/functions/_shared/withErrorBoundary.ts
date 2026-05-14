// =============================================================================
//  _shared/withErrorBoundary.ts
// -----------------------------------------------------------------------------
//  Pflicht-Wrapper für jede Edge-Function-Entry. Fängt jede ungefangene
//  Exception, schreibt sie strukturiert ins `pipeline_events`-Log und
//  antwortet mit einer einheitlichen 500-Hülle inkl. correlation_id.
//
//  Verwendung:
//    Deno.serve(withErrorBoundary("commit-fact", async (req) => {
//      ...
//      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
//    }));
//
//  Bestehende, eigene Logger im Inneren bleiben unverändert — der Boundary
//  schützt nur den Last-Resort-Pfad. CORS-Preflight (OPTIONS) wird automatisch
//  bedient, damit kein Caller außerhalb der Boundary Headers vergisst.
// =============================================================================

import { createLogger } from "./logger.ts";
import { corsHeaders } from "./http.ts";

export type Handler = (req: Request) => Promise<Response> | Response;

export function withErrorBoundary(fn: string, handler: Handler): Handler {
  return async (req: Request) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    try {
      return await handler(req);
    } catch (err) {
      const log = createLogger({ fn });
      log.error("uncaught", "edge function crashed", err, {
        url: req.url,
        method: req.method,
      });
      await log.flush().catch(() => {});
      const message = err instanceof Error ? err.message : String(err);
      return new Response(
        JSON.stringify({
          ok: false,
          error: "internal_error",
          message,
          correlation_id: log.correlationId,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  };
}
