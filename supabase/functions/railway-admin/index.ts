// =============================================================================
//  railway-admin — Router
// -----------------------------------------------------------------------------
//  Universeller Railway-Admin-Proxy. Nutzt RAILWAY_API_TOKEN (Team-Token).
//  Action-Map ist auf Domänen-Module verteilt (handlers/<domain>.ts).
//  Verhalten 1:1 wie vor B3.2-Refactor — keine Action umbenannt, keine
//  Response-Schemas verändert.
//
//  Actions (siehe jeweilige Handler-Datei):
//    railway.ts   — list, project, set-vars, redeploy, tune-neo4j, raw,
//                   sync-supabase-to-railway
//    langsmith.ts — langsmith-raw/-key-info/-auth-matrix/-create-test-repo/
//                   -tenant-resolve/-list-workspaces/-write-probe/-probe
//    graphiti.ts  — graphiti-probe, test-mirror
//    aol.ts       — test-aol
//    promptHub.ts — prompt-cache-bust, prompt-state
//    diagnose.ts  — diagnose
// =============================================================================

import { withErrorBoundary } from "../_shared/withErrorBoundary.ts";
import { createLogger, type Logger } from "../_shared/logger.ts";
import { cors, type Handler, type HandlerCtx } from "./_helpers.ts";

import * as railway from "./handlers/railway.ts";
import * as langsmith from "./handlers/langsmith.ts";
import * as graphiti from "./handlers/graphiti.ts";
import * as aol from "./handlers/aol.ts";
import * as promptHub from "./handlers/promptHub.ts";
import * as diagnose from "./handlers/diagnose.ts";

const ALL_HANDLERS: Record<string, Handler> = {
  ...railway.handlers,
  ...langsmith.handlers,
  ...graphiti.handlers,
  ...aol.handlers,
  ...promptHub.handlers,
  ...diagnose.handlers,
};

Deno.serve(
  withErrorBoundary("railway-admin", async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    const log: Logger = createLogger({ fn: "railway-admin" });
    let action = "list";
    try {
      const body = await req.json().catch(() => ({}));
      action = body.action ?? "list";
      log.stage("start", "request", { action });

      const handler = ALL_HANDLERS[action];
      if (!handler) {
        return new Response(JSON.stringify({ error: "unknown action" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      const ctx: HandlerCtx = { log };
      const res = await handler(body, ctx);
      log.stage("done", "ok", { action });
      return res;
    } catch (e) {
      log.error("dispatch", "railway-admin failed", e, { action });
      return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    } finally {
      await log.flush();
    }
  }),
);
