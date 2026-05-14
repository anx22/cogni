// =============================================================================
//  inspect-graphiti
// -----------------------------------------------------------------------------
//  Liest Health + Such-Snapshot eines Project-Graphen über den deployten
//  graphiti-server (REST). group_id == project_id.
// =============================================================================

import { corsHeaders, fail, ok, requireUser } from "../_shared/inspect-auth.ts";
import { withErrorBoundary } from "../_shared/withErrorBoundary.ts";
import { createLogger } from "../_shared/logger.ts";

const BASE = (Deno.env.get("GRAPHITI_SERVICE_URL") ?? "").replace(/\/+$/, "");
const TOKEN = Deno.env.get("GRAPHITI_SERVICE_TOKEN") ?? "";

interface Body {
  action: "health" | "search" | "episodes";
  project_id?: string;
  query?: string;
  limit?: number;
}

async function gFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      ...(init.headers ?? {}),
    },
  });
}

Deno.serve(withErrorBoundary("inspect-graphiti", async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail(405, "POST only");

  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  const log = createLogger({ fn: "inspect-graphiti", userId: auth.userId });

  if (!BASE) {
    log.error("config", "GRAPHITI_SERVICE_URL not configured", new Error("missing-env"));
    await log.flush();
    return fail(500, "GRAPHITI_SERVICE_URL not configured");
  }

  let body: Body;
  try { body = await req.json() as Body; } catch {
    log.warn("input", "invalid JSON");
    await log.flush();
    return fail(400, "invalid JSON");
  }
  const action = body.action ?? "health";
  log.stage("start", "request", { action, project_id: body.project_id ?? null });

  try {
    if (action === "health") {
      const r = await gFetch("/healthcheck", { method: "GET" });
      const txt = await r.text();
      log.stage("done", "health probed", { status: r.status });
      await log.flush();
      return ok({ action, status: r.status, body: txt.slice(0, 400) });
    }

    if (action === "search") {
      if (!body.project_id) { await log.flush(); return fail(400, "project_id required"); }
      const r = await gFetch("/search", {
        method: "POST",
        body: JSON.stringify({
          group_ids: [body.project_id],
          query: body.query ?? "",
          max_facts: body.limit ?? 20,
        }),
      });
      const txt = await r.text();
      if (!r.ok) {
        log.error("search", "graphiti search error", new Error(`status ${r.status}`), { status: r.status });
        await log.flush();
        return fail(502, "graphiti search error", { status: r.status, body: txt.slice(0, 600) });
      }
      log.stage("done", "search ok", { status: r.status });
      await log.flush();
      return ok({ action, ...JSON.parse(txt) });
    }

    if (action === "episodes") {
      if (!body.project_id) { await log.flush(); return fail(400, "project_id required"); }
      const r = await gFetch(`/episodes/${encodeURIComponent(body.project_id)}?last_n=${body.limit ?? 20}`, {
        method: "GET",
      });
      const txt = await r.text();
      if (!r.ok) {
        log.error("episodes", "graphiti episodes error", new Error(`status ${r.status}`), { status: r.status });
        await log.flush();
        return fail(502, "graphiti episodes error", { status: r.status, body: txt.slice(0, 600) });
      }
      log.stage("done", "episodes ok", { status: r.status });
      await log.flush();
      return ok({ action, episodes: JSON.parse(txt) });
    }

    log.warn("input", "unknown action", { action });
    await log.flush();
    return fail(400, `unknown action: ${action}`);
  } catch (e) {
    log.error("upstream", "graphiti upstream error", e);
    await log.flush();
    return fail(502, "graphiti upstream error", { detail: String((e as Error).message ?? e) });
  }
}));
