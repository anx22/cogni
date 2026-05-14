// =============================================================================
//  inspect-langsmith
// -----------------------------------------------------------------------------
//  REST gegen LangSmith mit LANGSMITH_API_KEY.
//  Liefert Runs für eine session_name (typisch der LangGraph-thread_id =
//  aol_runs.id) — siehe https://api.smith.langchain.com/redoc.
// =============================================================================

import { corsHeaders, fail, ok, requireUser } from "../_shared/inspect-auth.ts";
import { withErrorBoundary } from "../_shared/withErrorBoundary.ts";
import { createLogger } from "../_shared/logger.ts";
import { createLangSmithClient, LangSmithError } from "../_shared/clients/langsmith.ts";

interface Body {
  action: "list" | "get";
  thread_id?: string;        // = aol_runs.id (LangGraph thread_id)
  run_id?: string;
  limit?: number;
}

Deno.serve(withErrorBoundary("inspect-langsmith", async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail(405, "POST only");

  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  const log = createLogger({ fn: "inspect-langsmith", userId: auth.userId });

  const client = createLangSmithClient();
  if (!client) {
    log.error("config", "LANGSMITH_API_KEY not configured", new Error("missing-env"));
    await log.flush();
    return fail(500, "LANGSMITH_API_KEY not configured");
  }

  let body: Body;
  try { body = await req.json() as Body; } catch {
    log.warn("input", "invalid JSON");
    await log.flush();
    return fail(400, "invalid JSON");
  }
  const action = body.action ?? "list";
  log.stage("start", "request", { action, thread_id: body.thread_id ?? null });

  try {
    if (action === "list") {
      const filter: Record<string, unknown> = {
        session: [client.project],
        limit: body.limit ?? 25,
        is_root: true,
      };
      if (body.thread_id) {
        filter.filter = `eq(extra.metadata.thread_id, "${body.thread_id}")`;
      }
      const data = await client.queryRuns(filter) as Record<string, unknown>;
      log.stage("done", "list ok");
      await log.flush();
      return ok({ action, project: client.project, ...data });
    }

    if (action === "get") {
      if (!body.run_id) { await log.flush(); return fail(400, "run_id required"); }
      const run = await client.getRun(body.run_id);
      log.stage("done", "get ok");
      await log.flush();
      return ok({ action, run });
    }

    log.warn("input", "unknown action", { action });
    await log.flush();
    return fail(400, `unknown action: ${action}`);
  } catch (e) {
    log.error("upstream", "langsmith upstream error", e);
    await log.flush();
    return fail(502, "langsmith upstream error", { detail: String((e as Error).message ?? e) });
  }
}));
