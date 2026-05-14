// =============================================================================
//  _shared/auth.ts — vereinheitlichte User-Auth für Edge Functions
// -----------------------------------------------------------------------------
//  Validiert den Bearer-Token, gibt User-Info + einen User-scoped Supabase-
//  Client zurück. Ersetzt die zuvor pro Function inline geschriebene Logik.
// =============================================================================

import {
  createClient,
  type SupabaseClient,
  type User,
} from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type AuthSuccess = {
  ok: true;
  userId: string;
  user: User;
  /** User-scoped Client (RLS aktiv, Authorization-Header gesetzt). */
  client: SupabaseClient;
  /** Roher Bearer-Token (für Weiterreichen an andere Services). */
  token: string;
};

export type AuthFailure = {
  ok: false;
  error: string;
  status: number;
};

export type AuthResult = AuthSuccess | AuthFailure;

/**
 * Prüft den Authorization-Header und gibt User + Client zurück.
 * Liefert kein Response-Objekt — der Aufrufer entscheidet, wie er antwortet
 * (typischerweise via `fail(error, status)` aus `_shared/http.ts`).
 */
export async function getAuthenticatedUser(req: Request): Promise<AuthResult> {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.toLowerCase().startsWith("bearer ")) {
    return { ok: false, error: "missing bearer token", status: 401 };
  }
  const token = auth.slice(7).trim();
  if (!token) {
    return { ok: false, error: "missing bearer token", status: 401 };
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) {
    return { ok: false, error: "supabase env missing", status: 500 };
  }

  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) {
    return { ok: false, error: "invalid token", status: 401 };
  }

  return { ok: true, userId: data.user.id, user: data.user, client, token };
}
