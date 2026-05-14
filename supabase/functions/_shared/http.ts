// =============================================================================
//  _shared/http.ts — kanonische HTTP-Helfer für Edge Functions
// -----------------------------------------------------------------------------
//  Eine Quelle für CORS-Headers + JSON-Responses. Jede Edge Function importiert
//  von hier statt eigene `corsHeaders`/`ok`/`fail`-Definitionen zu pflegen.
// =============================================================================

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

/** 200 (oder konfigurierbar) JSON-Response mit CORS-Headers. */
export function ok(payload: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    ...init,
    headers: { ...jsonHeaders, ...(init?.headers ?? {}) },
  });
}

/** Fehler-Response. `extra` wird in den Body gemerged. */
export function fail(
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
): Response {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: jsonHeaders,
  });
}

/** OPTIONS-Preflight. Liefert `null` wenn Request keine Preflight ist. */
export function handleOptions(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}
