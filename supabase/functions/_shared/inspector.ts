// =============================================================================
//  _shared/inspector.ts — gemeinsames Skelett für inspect-* Edge Functions.
// -----------------------------------------------------------------------------
//  Vereinheitlicht: CORS-Preflight, POST-only, Auth, Logger, Body-Parse,
//  Action-Dispatch, einheitliches Response-Format und Error-Wrapping.
//  Jede Inspector-Function reduziert sich auf eine Action-Map.
// =============================================================================

import { corsHeaders, fail, ok, requireUser } from "./inspect-auth.ts";
import { withErrorBoundary } from "./withErrorBoundary.ts";
import { createLogger, type Logger } from "./logger.ts";

export type InspectorActionResult = Response | Record<string, unknown>;

export interface InspectorContext {
  log: Logger;
  userId: string;
  body: Record<string, unknown>;
}

export type InspectorAction = (ctx: InspectorContext) => Promise<InspectorActionResult>;

export interface InspectorOptions {
  defaultAction?: string;
  /** Wenn true, wird auch ohne body.action der defaultAction genommen (ohne 400). */
  allowMissingAction?: boolean;
}

/**
 * Liefert einen Deno-Handler, der CORS, Auth, Logging und Action-Dispatch
 * standardisiert. Verwendung:
 *
 *   Deno.serve(inspector("inspect-foo", {
 *     health: async ({ log }) => ({ ok: true }),
 *     search: async ({ body }) => ({ hits: [] }),
 *   }, { defaultAction: "health" }));
 */
export function inspector(
  fnName: string,
  actions: Record<string, InspectorAction>,
  options: InspectorOptions = {},
): (req: Request) => Promise<Response> {
  return withErrorBoundary(fnName, async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return fail(405, "POST only");

    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const log = createLogger({ fn: fnName, userId: auth.userId });

    let body: Record<string, unknown> = {};
    try {
      const text = await req.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      log.warn("input", "invalid JSON");
      await log.flush();
      return fail(400, "invalid JSON");
    }

    const action = (body.action as string | undefined) ?? options.defaultAction;
    if (!action) {
      log.warn("input", "missing action");
      await log.flush();
      return fail(400, "action required");
    }
    log.stage("start", "request", { action });

    const handler = actions[action];
    if (!handler) {
      log.warn("input", "unknown action", { action });
      await log.flush();
      return fail(400, `unknown action: ${action}`);
    }

    try {
      const result = await handler({ log, userId: auth.userId, body });
      log.stage("done", `${action} ok`);
      await log.flush();
      if (result instanceof Response) return result;
      return ok({ action, ...result });
    } catch (e) {
      log.error("upstream", `${action} failed`, e);
      await log.flush();
      return fail(502, `${fnName} upstream error`, {
        action,
        detail: String((e as Error).message ?? e),
      });
    }
  });
}
