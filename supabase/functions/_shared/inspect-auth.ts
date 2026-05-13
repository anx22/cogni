// =============================================================================
//  inspect-auth.ts — gemeinsame Auth-Hilfe für inspect-* Functions
// -----------------------------------------------------------------------------
//  Inspector-Functions sind Dev-Werkzeuge (DevLog-Panel). Wir prüfen, dass der
//  Aufruf einen gültigen User-JWT trägt — kein Anonym-Zugriff, kein Service-Key.
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function requireUser(req: Request): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: Response }
> {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.toLowerCase().startsWith("bearer ")) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "missing bearer token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }
  const token = auth.slice(7).trim();
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const sb = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }
  return { ok: true, userId: data.user.id };
}

export function ok(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function fail(status: number, message: string, extra?: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
