// Universeller Railway-Admin-Proxy. Nutzt RAILWAY_API_TOKEN (Team-Token).
// Actions:
//   { action: "list" }                                — alle Teams + Projekte + Services
//   { action: "project", projectId }                  — Details eines Projekts
//   { action: "set-vars", projectId, environmentId, serviceId, vars: {k:v} }
//   { action: "redeploy", serviceId, environmentId }
//   { action: "tune-neo4j", projectId?, environmentId?, serviceId? }
//                                                      — Auto-Discovery wenn IDs fehlen
//   { action: "raw", query, variables? }              — beliebige GraphQL-Query

const RAILWAY_API = "https://backboard.railway.com/graphql/v2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
  const json = await res.json().catch(() => ({}));
  if (json.errors) {
    throw new Error("Railway GraphQL error: " + JSON.stringify(json.errors));
  }
  return json.data;
}

const NEO4J_VARS: Record<string, string> = {
  NEO4J_server_memory_heap_initial__size: "512m",
  NEO4J_server_memory_heap_max__size: "512m",
  NEO4J_server_memory_pagecache_size: "256m",
};

async function listAll() {
  return await gql(`
    query {
      teams {
        edges {
          node {
            id
            name
            projects {
              edges {
                node {
                  id
                  name
                  environments { edges { node { id name } } }
                  services { edges { node { id name } } }
                }
              }
            }
          }
        }
      }
    }
  `);
}

async function projectDetails(projectId: string) {
  return await gql(
    `query($id: String!) {
       project(id: $id) {
         id
         name
         environments { edges { node { id name } } }
         services { edges { node { id name } } }
       }
     }`,
    { id: projectId },
  );
}

async function setVars(
  projectId: string,
  environmentId: string,
  serviceId: string,
  vars: Record<string, string>,
) {
  const out: unknown[] = [];
  for (const [name, value] of Object.entries(vars)) {
    const r = await gql(
      `mutation($input: VariableUpsertInput!) { variableUpsert(input: $input) }`,
      { input: { projectId, environmentId, serviceId, name, value } },
    );
    out.push({ name, value, result: r });
  }
  return out;
}

async function redeploy(serviceId: string, environmentId: string) {
  return await gql(
    `mutation($serviceId: String!, $environmentId: String!) {
       serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId)
     }`,
    { serviceId, environmentId },
  );
}

async function autoDiscover(targetServiceName: string) {
  const data = await listAll() as any;
  for (const teamEdge of data?.teams?.edges ?? []) {
    for (const projEdge of teamEdge?.node?.projects?.edges ?? []) {
      const proj = projEdge.node;
      const svc = proj.services?.edges?.find(
        (e: any) => e?.node?.name?.toLowerCase() === targetServiceName.toLowerCase(),
      );
      if (svc) {
        const env = proj.environments?.edges?.[0]?.node;
        return {
          projectId: proj.id,
          projectName: proj.name,
          environmentId: env?.id,
          environmentName: env?.name,
          serviceId: svc.node.id,
          serviceName: svc.node.name,
        };
      }
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "list";

    if (action === "list") {
      return new Response(JSON.stringify(await listAll(), null, 2), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (action === "project") {
      if (!body.projectId) throw new Error("projectId required");
      return new Response(
        JSON.stringify(await projectDetails(body.projectId), null, 2),
        { headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    if (action === "set-vars") {
      const { projectId, environmentId, serviceId, vars } = body;
      if (!projectId || !environmentId || !serviceId || !vars) {
        throw new Error("projectId, environmentId, serviceId, vars required");
      }
      const r = await setVars(projectId, environmentId, serviceId, vars);
      return new Response(JSON.stringify({ ok: true, set: r }, null, 2), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (action === "redeploy") {
      const { serviceId, environmentId } = body;
      if (!serviceId || !environmentId) {
        throw new Error("serviceId, environmentId required");
      }
      const r = await redeploy(serviceId, environmentId);
      return new Response(JSON.stringify({ ok: true, deploy: r }, null, 2), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (action === "tune-neo4j") {
      let { projectId, environmentId, serviceId } = body;
      let discovered: unknown = null;
      if (!projectId || !environmentId || !serviceId) {
        const d = await autoDiscover("neo4j");
        if (!d) throw new Error("Could not auto-discover neo4j service");
        projectId = d.projectId;
        environmentId = d.environmentId;
        serviceId = d.serviceId;
        discovered = d;
      }
      const set = await setVars(projectId, environmentId, serviceId, NEO4J_VARS);
      const deploy = await redeploy(serviceId, environmentId);
      return new Response(
        JSON.stringify({ ok: true, discovered, set, deploy }, null, 2),
        { headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    if (action === "raw") {
      const { query, variables } = body;
      if (!query) throw new Error("query required");
      return new Response(
        JSON.stringify(await gql(query, variables ?? {}), null, 2),
        { headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: "unknown action" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
