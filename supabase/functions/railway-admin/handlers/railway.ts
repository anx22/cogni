// =============================================================================
//  handlers/railway.ts — Railway-Core-Actions
// -----------------------------------------------------------------------------
//  list, project, set-vars, redeploy, tune-neo4j, raw, sync-supabase-to-railway
//  Verhalten 1:1 aus dem alten Monolithen.
// =============================================================================

import {
  type Handler,
  autoDiscover,
  gql,
  jsonResponse,
  listAll,
  prefix,
  projectDetails,
  redeploy,
  setVars,
} from "../_helpers.ts";

const NEO4J_VARS: Record<string, string> = {
  NEO4J_server_memory_heap_initial__size: "512m",
  NEO4J_server_memory_heap_max__size: "512m",
  NEO4J_server_memory_pagecache_size: "256m",
};

export const handlers: Record<string, Handler> = {
  "list": async () => jsonResponse(await listAll()),

  "project": async (body) => {
    if (!body.projectId) throw new Error("projectId required");
    return jsonResponse(await projectDetails(body.projectId));
  },

  "set-vars": async (body) => {
    const { projectId, environmentId, serviceId, vars } = body;
    if (!projectId || !environmentId || !serviceId || !vars) {
      throw new Error("projectId, environmentId, serviceId, vars required");
    }
    const r = await setVars(projectId, environmentId, serviceId, vars);
    return jsonResponse({ ok: true, set: r });
  },

  "redeploy": async (body) => {
    const { serviceId, environmentId } = body;
    if (!serviceId || !environmentId) {
      throw new Error("serviceId, environmentId required");
    }
    const r = await redeploy(serviceId, environmentId);
    return jsonResponse({ ok: true, deploy: r });
  },

  "tune-neo4j": async (body) => {
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
    return jsonResponse({ ok: true, discovered, set, deploy });
  },

  "raw": async (body) => {
    const { query, variables } = body;
    if (!query) throw new Error("query required");
    return jsonResponse(await gql(query, variables ?? {}));
  },

  "sync-supabase-to-railway": async (body) => {
    const { projectId, environmentId, services } = body as {
      projectId: string;
      environmentId: string;
      services: { serviceId: string; serviceName: string; vars: string[] }[];
    };
    if (!projectId || !environmentId || !Array.isArray(services)) {
      throw new Error("projectId, environmentId, services[] required");
    }
    const out: unknown[] = [];
    for (const svc of services) {
      const payload: Record<string, string> = {};
      for (const name of svc.vars) {
        const v = Deno.env.get(name);
        if (v) payload[name] = v;
      }
      const r = await setVars(projectId, environmentId, svc.serviceId, payload);
      const dep = await redeploy(svc.serviceId, environmentId);
      out.push({
        service: svc.serviceName,
        set: r.map((x) => ({ name: x.name, prefix: prefix(x.value) })),
        deploy: dep,
      });
    }
    return jsonResponse({ ok: true, services: out });
  },
};
