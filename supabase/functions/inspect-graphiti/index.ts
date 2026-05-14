// =============================================================================
//  inspect-graphiti — Action-Dispatch via _shared/inspector.ts.
//  Liest Health + Such-Snapshot eines Project-Graphen über den deployten
//  graphiti-server (REST). group_id == project_id.
// =============================================================================

import { fail } from "../_shared/inspect-auth.ts";
import { inspector } from "../_shared/inspector.ts";

const BASE = (Deno.env.get("GRAPHITI_SERVICE_URL") ?? "").replace(/\/+$/, "");
const TOKEN = Deno.env.get("GRAPHITI_SERVICE_TOKEN") ?? "";

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

Deno.serve(inspector("inspect-graphiti", {
  health: async () => {
    if (!BASE) return fail(500, "GRAPHITI_SERVICE_URL not configured");
    const r = await gFetch("/healthcheck", { method: "GET" });
    const txt = await r.text();
    return { status: r.status, body: txt.slice(0, 400) };
  },

  search: async ({ body }) => {
    if (!BASE) return fail(500, "GRAPHITI_SERVICE_URL not configured");
    const projectId = body.project_id as string | undefined;
    if (!projectId) return fail(400, "project_id required");
    const r = await gFetch("/search", {
      method: "POST",
      body: JSON.stringify({
        group_ids: [projectId],
        query: (body.query as string | undefined) ?? "",
        max_facts: (body.limit as number | undefined) ?? 20,
      }),
    });
    const txt = await r.text();
    if (!r.ok) {
      return fail(502, "graphiti search error", { status: r.status, body: txt.slice(0, 600) });
    }
    return JSON.parse(txt);
  },

  episodes: async ({ body }) => {
    if (!BASE) return fail(500, "GRAPHITI_SERVICE_URL not configured");
    const projectId = body.project_id as string | undefined;
    if (!projectId) return fail(400, "project_id required");
    const limit = (body.limit as number | undefined) ?? 20;
    const r = await gFetch(`/episodes/${encodeURIComponent(projectId)}?last_n=${limit}`, {
      method: "GET",
    });
    const txt = await r.text();
    if (!r.ok) {
      return fail(502, "graphiti episodes error", { status: r.status, body: txt.slice(0, 600) });
    }
    return { episodes: JSON.parse(txt) };
  },
}, { defaultAction: "health" }));
