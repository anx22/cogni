// Einmal-Admin-Tool: liest Railway-Projekte/Services oder setzt Neo4j-Memory-Vars.
// Nutzt RAILWAY_API_TOKEN aus den Secrets. Kein User-Input nötig.
const RAILWAY_API = "https://backboard.railway.com/graphql/v2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

async function gql(query: string, variables: Record<string, unknown> = {}) {
  const token = Deno.env.get("RAILWAY_API_TOKEN");
  if (!token) throw new Error("RAILWAY_API_TOKEN missing");
  const res = await fetch(RAILWAY_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "list";

    if (action === "list") {
      // Project tokens: use projectToken query (no `me`)
      const data = await gql(`
        query {
          projectToken {
            project {
              id
              name
              environments { edges { node { id name } } }
              services { edges { node { id name } } }
            }
            environment { id name }
          }
        }
      `);
      return new Response(JSON.stringify(data, null, 2), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (action === "tune-neo4j") {
      const { projectId, environmentId, serviceId } = body;
      if (!projectId || !environmentId || !serviceId) {
        throw new Error("projectId, environmentId, serviceId required");
      }
      const vars: Record<string, string> = {
        NEO4J_server_memory_heap_initial__size: "512m",
        NEO4J_server_memory_heap_max__size: "512m",
        NEO4J_server_memory_pagecache_size: "256m",
      };
      const results: unknown[] = [];
      for (const [name, value] of Object.entries(vars)) {
        const r = await gql(
          `mutation($input: VariableUpsertInput!) {
             variableUpsert(input: $input)
           }`,
          { input: { projectId, environmentId, serviceId, name, value } },
        );
        results.push({ name, value, result: r });
      }
      // Trigger redeploy
      const deploy = await gql(
        `mutation($serviceId: String!, $environmentId: String!) {
           serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId)
         }`,
        { serviceId, environmentId },
      );
      return new Response(
        JSON.stringify({ ok: true, vars: results, deploy }, null, 2),
        { headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: "unknown action" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
