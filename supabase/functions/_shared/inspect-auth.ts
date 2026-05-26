// =============================================================================
//  inspect-auth.ts — Auth-Hilfe für inspect-* Functions
// -----------------------------------------------------------------------------
//  Dünner Adapter über `_shared/auth.ts` + `_shared/http.ts`. Behält die
//  bestehende API (`requireUser`, `corsHeaders`, `ok`, `fail`) für die
//  Inspector-Functions, damit B1.5 keine Verhaltensänderung erzwingt.
// =============================================================================

import { getAuthenticatedUser } from "./auth.ts";
import { corsHeaders, ok as okJson, fail as failJson } from "./http.ts";

export { corsHeaders };

export async function requireUser(
  req: Request,
): Promise<{ ok: true; userId: string } | { ok: false; response: Response }> {
  const r = await getAuthenticatedUser(req);
  if (!r.ok) {
    return { ok: false, response: failJson(r.error, r.status) };
  }
  return { ok: true, userId: r.userId };
}

export function ok(data: unknown): Response {
  return okJson(data);
}

export function fail(status: number, message: string, extra?: Record<string, unknown>): Response {
  return failJson(message, status, extra);
}
