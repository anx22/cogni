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

const BASE = (Deno.env.get("LANGSMITH_ENDPOINT") ??
  Deno.env.get("LANGSMITH_BASE_URL") ??
  "https://eu.api.smith.langchain.com").replace(/\/$/, "");
const PROJECT = Deno.env.get("LANGCHAIN_PROJECT") ?? "produktintelligenz-aol";

interface Body {
  action: "list" | "get";
  thread_id?: string;        // = aol_runs.id (LangGraph thread_id)
  run_id?: string;
  limit?: number;
}

async function lsFetch(path: string, init: RequestInit = {}, key: string): Promise<Response> {
  const workspaceId = Deno.env.get("LANGSMITH_WORKSPACE_ID") ?? Deno.env.get("LANGSMITH_PROMPT_OWNER");
  const headers: Record<string, string> = { "x-api-key": key, "Content-Type": "application/json", ...(init.headers as Record<string, string> ?? {}) };
  if (workspaceId) headers["x-tenant-id"] = workspaceId;
  return fetch(`${BASE}${path}`, {
    ...init,
    headers,
  });
}

Deno.serve(withErrorBoundary("inspect-langsmith", async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail(405, "POST only");

  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  const key = Deno.env.get("LANGSMITH_API_KEY");
  if (!key) return fail(500, "LANGSMITH_API_KEY not configured");

  let body: Body;
  try { body = await req.json() as Body; } catch { return fail(400, "invalid JSON"); }
  const action = body.action ?? "list";

  try {
    if (action === "list") {
      // POST /runs/query — filter via session_name + optional thread_id metadata
      const filter: Record<string, unknown> = {
        session: [PROJECT],
        limit: body.limit ?? 25,
        is_root: true,
      };
      if (body.thread_id) {
        // LangSmith stores thread_id in run.extra.metadata
        filter.filter = `eq(extra.metadata.thread_id, "${body.thread_id}")`;
      }
      const r = await lsFetch("/runs/query", { method: "POST", body: JSON.stringify(filter) }, key);
      const txt = await r.text();
      if (!r.ok) return fail(502, "langsmith error", { status: r.status, body: txt.slice(0, 600) });
      return ok({ action, project: PROJECT, ...JSON.parse(txt) });
    }

    if (action === "get") {
      if (!body.run_id) return fail(400, "run_id required");
      const r = await lsFetch(`/runs/${body.run_id}`, { method: "GET" }, key);
      const txt = await r.text();
      if (!r.ok) return fail(502, "langsmith error", { status: r.status, body: txt.slice(0, 600) });
      return ok({ action, run: JSON.parse(txt) });
    }

    return fail(400, `unknown action: ${action}`);
  } catch (e) {
    return fail(502, "langsmith upstream error", { detail: String((e as Error).message ?? e) });
  }
}));
