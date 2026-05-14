// =============================================================================
//  inspect-railway
// -----------------------------------------------------------------------------
//  Liest Status + Logs des AOL-Service über die Railway Public GraphQL API
//  (https://docs.railway.com/reference/public-api, Endpoint backboard/v2).
//  Erfordert RAILWAY_API_TOKEN (Account-Token).
// =============================================================================

import { corsHeaders, fail, ok, requireUser } from "../_shared/inspect-auth.ts";
import { withErrorBoundary } from "../_shared/withErrorBoundary.ts";
import { createLogger } from "../_shared/logger.ts";

const RAILWAY_GRAPHQL = "https://backboard.railway.com/graphql/v2";

interface Body {
  action: "me" | "projects" | "deployments" | "logs";
  project_id?: string;       // Railway-Project-ID (nicht Lovable!)
  service_id?: string;
  environment_id?: string;
  deployment_id?: string;
  limit?: number;
}

async function gql<T>(query: string, variables: Record<string, unknown>, token: string): Promise<T> {
  const res = await fetch(RAILWAY_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`Railway ${res.status}: ${txt.slice(0, 400)}`);
  const json = JSON.parse(txt);
  if (json.errors) throw new Error(`Railway GraphQL: ${JSON.stringify(json.errors).slice(0, 400)}`);
  return json.data as T;
}

Deno.serve(withErrorBoundary("inspect-railway", async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail(405, "POST only");

  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  const token = Deno.env.get("RAILWAY_API_TOKEN");
  if (!token) return fail(500, "RAILWAY_API_TOKEN not configured");

  let body: Body;
  try { body = await req.json() as Body; } catch { return fail(400, "invalid JSON"); }
  const action = body.action ?? "me";

  try {
    if (action === "me") {
      const data = await gql<{ me: { name: string; email: string; projects: { edges: { node: { id: string; name: string } }[] } } }>(
        `query { me { name email projects { edges { node { id name } } } } }`, {}, token,
      );
      return ok({ action, me: data.me });
    }

    if (action === "projects") {
      const data = await gql<{ projects: { edges: { node: { id: string; name: string; services: { edges: { node: { id: string; name: string } }[] }; environments: { edges: { node: { id: string; name: string } }[] } } }[] } }>(
        `query { projects { edges { node { id name services { edges { node { id name } } } environments { edges { node { id name } } } } } } }`, {}, token,
      );
      return ok({ action, projects: data.projects.edges.map((e) => e.node) });
    }

    if (action === "deployments") {
      if (!body.project_id || !body.service_id || !body.environment_id) {
        return fail(400, "project_id, service_id, environment_id required");
      }
      const data = await gql<{ deployments: { edges: { node: { id: string; status: string; createdAt: string; staticUrl?: string } }[] } }>(
        `query($p: String!, $s: String!, $e: String!, $n: Int) {
           deployments(first: $n, input: { projectId: $p, serviceId: $s, environmentId: $e }) {
             edges { node { id status createdAt staticUrl } }
           }
         }`,
        { p: body.project_id, s: body.service_id, e: body.environment_id, n: body.limit ?? 10 },
        token,
      );
      return ok({ action, deployments: data.deployments.edges.map((e) => e.node) });
    }

    if (action === "logs") {
      if (!body.deployment_id) return fail(400, "deployment_id required");
      const data = await gql<{ deploymentLogs: { message: string; severity?: string; timestamp: string }[] }>(
        `query($d: String!, $n: Int) { deploymentLogs(deploymentId: $d, limit: $n) { message severity timestamp } }`,
        { d: body.deployment_id, n: body.limit ?? 100 },
        token,
      );
      return ok({ action, logs: data.deploymentLogs });
    }

    return fail(400, `unknown action: ${action}`);
  } catch (e) {
    return fail(502, "railway upstream error", { detail: String((e as Error).message ?? e) });
  }
}));
