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

function prefix(s: string | undefined | null): string | null {
  if (!s) return null;
  return `${s.slice(0, 8)}…(${s.length})`;
}

async function listAll() {
  const ws = await gql(`{ apiToken { workspaces { id name } } }`) as any;
  const workspaces = ws?.apiToken?.workspaces ?? [];
  const out: unknown[] = [];
  for (const w of workspaces) {
    const data = await gql(
      `query($wid: String!) {
         workspace(workspaceId: $wid) {
           id name
           projects {
             edges {
               node {
                 id name
                 environments { edges { node { id name } } }
                 services { edges { node { id name } } }
               }
             }
           }
         }
       }`,
      { wid: w.id },
    );
    out.push(data);
  }
  return { workspaces: out };
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
  for (const wsBlock of data?.workspaces ?? []) {
    const ws = wsBlock?.workspace;
    for (const projEdge of ws?.projects?.edges ?? []) {
      const proj = projEdge.node;
      const svc = proj.services?.edges?.find(
        (e: any) => e?.node?.name?.toLowerCase() === targetServiceName.toLowerCase(),
      );
      if (svc) {
        const env = proj.environments?.edges?.[0]?.node;
        return {
          workspaceId: ws.id,
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

    if (action === "prompt-cache-bust" || action === "prompt-state") {
      const { bustPromptCache, promptCacheState, getPrompt } = await import("../_shared/promptHub.ts");
      if (action === "prompt-cache-bust") {
        const cleared = bustPromptCache();
        return new Response(JSON.stringify({ ok: true, ...cleared }), {
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      // prompt-state: optional Live-Pull, um zu sehen welche Version aktuell wäre
      const state = promptCacheState();
      const probes: Record<string, unknown> = {};
      if (body.probe) {
        const names: string[] = Array.isArray(body.probe) ? body.probe : ["extract-facts", "suggest-assignment"];
        for (const n of names) {
          const r = await getPrompt(n, { fallback: "(fallback)" });
          probes[n] = { version: r.version, source: r.source, length: r.system.length };
        }
      }
      return new Response(JSON.stringify({ ok: true, state, probes }, null, 2), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (action === "langsmith-key-info") {
      const k = Deno.env.get("LANGSMITH_API_KEY") ?? "";
      return new Response(JSON.stringify({
        ok: true,
        present: !!k,
        length: k.length,
        prefix: k.slice(0, 8),
        suffix: k.slice(-4),
        owner_env: Deno.env.get("LANGSMITH_PROMPT_OWNER") ?? null,
      }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (action === "langsmith-auth-matrix") {
      const k = Deno.env.get("LANGSMITH_API_KEY") ?? "";
      const tenantHint = Deno.env.get("LANGSMITH_PROMPT_OWNER") ?? "";
      const url = "https://api.smith.langchain.com/api/v1/sessions?limit=1";
      const variants: Record<string, Record<string, string>> = {
        "x-api-key": { "x-api-key": k },
        "X-API-Key": { "X-API-Key": k },
        "Authorization Bearer": { Authorization: `Bearer ${k}` },
        "x-api-key + X-Tenant-Id": { "x-api-key": k, "X-Tenant-Id": tenantHint },
        "Bearer + X-Tenant-Id": { Authorization: `Bearer ${k}`, "X-Tenant-Id": tenantHint },
      };
      const out: Record<string, unknown> = {};
      for (const [name, headers] of Object.entries(variants)) {
        try {
          const r = await fetch(url, { headers });
          out[name] = { status: r.status, body: (await r.text()).slice(0, 200) };
        } catch (e) {
          out[name] = { error: String(e) };
        }
      }
      return new Response(JSON.stringify({ ok: true, results: out }, null, 2), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (action === "langsmith-create-test-repo") {
      const k = Deno.env.get("LANGSMITH_API_KEY") ?? "";
      const base = body.base ?? Deno.env.get("LANGSMITH_BASE_URL") ?? "https://eu.api.smith.langchain.com";
      const tid: string = body.tenant ?? Deno.env.get("LANGSMITH_PROMPT_OWNER") ?? "";
      const headers: Record<string, string> = {
        "x-api-key": k,
        "Content-Type": "application/json",
      };
      if (/^[0-9a-f-]{36}$/i.test(tid)) headers["X-Tenant-Id"] = tid;
      const r = await fetch(`${base}/api/v1/repos/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          repo_handle: body.repo_handle ?? "produktintelligenz-probe",
          description: "Created by Lovable agent to verify write access",
          is_public: false,
        }),
      });
      const text = await r.text();
      return new Response(JSON.stringify({ ok: true, base, tenant: tid, status: r.status, body: text.slice(0, 800) }, null, 2), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (action === "langsmith-tenant-resolve") {
      const k = Deno.env.get("LANGSMITH_API_KEY") ?? "";
      const tid = Deno.env.get("LANGSMITH_PROMPT_OWNER") ?? "";
      const headers = { "x-api-key": k, "X-Tenant-Id": tid };
      const paths = [
        "/api/v1/workspaces/current",
        "/api/v1/orgs/current",
        "/api/v1/info",
        "/api/v1/api-key/current",
      ];
      const out: Record<string, unknown> = {};
      for (const p of paths) {
        try {
          const r = await fetch(`https://api.smith.langchain.com${p}`, { headers });
          out[p] = { status: r.status, body: (await r.text()).slice(0, 400) };
        } catch (e) {
          out[p] = { error: String(e) };
        }
      }
      return new Response(JSON.stringify({ ok: true, results: out }, null, 2), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (action === "langsmith-list-workspaces") {
      const k = Deno.env.get("LANGSMITH_API_KEY") ?? "";
      const orgId = Deno.env.get("LANGSMITH_PROMPT_OWNER") ?? "";
      const r = await fetch("https://api.smith.langchain.com/api/v1/workspaces?include_deleted=false", {
        headers: {
          "X-API-Key": k,
          "X-Organization-Id": orgId,
        },
      });
      const text = await r.text();
      return new Response(JSON.stringify({ ok: true, status: r.status, body: text.slice(0, 2000) }, null, 2), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (action === "langsmith-write-probe") {
      const key = Deno.env.get("LANGSMITH_API_KEY") ?? "";
      const r = await fetch("https://api.smith.langchain.com/api/v1/repos/", {
        method: "POST",
        headers: { "x-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_handle: "produktintelligenz-test-write",
          description: "write capability probe",
          is_public: false,
        }),
      });
      const t = await r.text();
      return new Response(JSON.stringify({ ok: true, status: r.status, body: t.slice(0, 600) }, null, 2), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (action === "langsmith-probe") {
      const key = Deno.env.get("LANGSMITH_API_KEY") ?? "";
      if (!key) {
        return new Response(JSON.stringify({ ok: false, error: "LANGSMITH_API_KEY missing" }), {
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      const base: string = body.base ?? "https://api.smith.langchain.com";
      const sendTenant: boolean = body.sendTenant !== false; // default true
      const tenantOverride: string | undefined = body.tenant;
      const paths: string[] = body.paths ?? [
        "/api/v1/workspaces/current",
        "/api/v1/info",
        "/api/v1/orgs/current",
        "/api/v1/sessions?limit=1",
      ];
      const out: Record<string, unknown> = {};
      for (const p of paths) {
        try {
          const tid = tenantOverride ?? Deno.env.get("LANGSMITH_PROMPT_OWNER") ?? "";
          const h: Record<string, string> = { "x-api-key": key };
          if (sendTenant && /^[0-9a-f-]{36}$/i.test(tid)) h["X-Tenant-Id"] = tid;
          const r = await fetch(`${base}${p}`, { headers: h });
          const t = await r.text();
          out[p] = { status: r.status, body: t.slice(0, 500) };
        } catch (e) {
          out[p] = { error: String(e) };
        }
      }
      return new Response(JSON.stringify({ ok: true, base, sendTenant, results: out }, null, 2), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

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

    if (action === "diagnose") {
      const sb = {
        AOL_SERVICE_TOKEN: prefix(Deno.env.get("AOL_SERVICE_TOKEN")),
        GRAPHITI_SERVICE_TOKEN: prefix(Deno.env.get("GRAPHITI_SERVICE_TOKEN")),
        AOL_SERVICE_URL: Deno.env.get("AOL_SERVICE_URL") ?? null,
        GRAPHITI_SERVICE_URL: Deno.env.get("GRAPHITI_SERVICE_URL") ?? null,
        LANGSMITH_API_KEY: prefix(Deno.env.get("LANGSMITH_API_KEY")),
      };
      const aolVars = await gql(
        `query($p:String!,$e:String!,$s:String!){variables(projectId:$p,environmentId:$e,serviceId:$s)}`,
        { p: body.projectId, e: body.environmentId, s: body.aolServiceId },
      ) as any;
      const rwAol = aolVars?.variables ?? {};
      const compare = {
        aol_token: { supabase: sb.AOL_SERVICE_TOKEN, railway: prefix(rwAol.AOL_SERVICE_TOKEN), match: prefix(Deno.env.get("AOL_SERVICE_TOKEN")) === prefix(rwAol.AOL_SERVICE_TOKEN) },
        langsmith: { supabase: sb.LANGSMITH_API_KEY, railway: prefix(rwAol.LANGSMITH_API_KEY), match: prefix(Deno.env.get("LANGSMITH_API_KEY")) === prefix(rwAol.LANGSMITH_API_KEY) },
        graphiti_url: { supabase: sb.GRAPHITI_SERVICE_URL, railway_aol: rwAol.GRAPHITI_SERVICE_URL ?? null, match: sb.GRAPHITI_SERVICE_URL === rwAol.GRAPHITI_SERVICE_URL },
      };
      let aolPing: unknown = null;
      const aolUrl = (sb.AOL_SERVICE_URL ?? "").replace(/\/+$/, "");
      const aolHttps = aolUrl && !/^https?:\/\//i.test(aolUrl) ? `https://${aolUrl}` : aolUrl;
      if (aolHttps) {
        try {
          const r = await fetch(`${aolHttps}/health`);
          aolPing = { health_status: r.status, health_body: (await r.text()).slice(0, 200) };
        } catch (e) { aolPing = { error: String(e) }; }
      }
      return new Response(JSON.stringify({ supabase: sb, compare, aolPing }, null, 2), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (action === "graphiti-probe") {
      const gUrl = (Deno.env.get("GRAPHITI_SERVICE_URL") ?? "").replace(/\/+$/, "");
      const gBase = gUrl && !/^https?:\/\//i.test(gUrl) ? `https://${gUrl}` : gUrl;
      const gToken = Deno.env.get("GRAPHITI_SERVICE_TOKEN") ?? "";
      const headers = { "Content-Type": "application/json", ...(gToken ? { Authorization: `Bearer ${gToken}` } : {}) };
      const { project_id, query } = body;
      const epRes = await fetch(`${gBase}/episodes/${encodeURIComponent(project_id)}?last_n=20`, { headers });
      const epBody = await epRes.text();
      const sRes = await fetch(`${gBase}/search`, {
        method: "POST", headers,
        body: JSON.stringify({ query: query ?? "Teinacher", group_ids: [project_id], max_facts: 20 }),
      });
      const sBody = await sRes.text();
      return new Response(JSON.stringify({
        episodes: { status: epRes.status, body: epBody.slice(0, 1500) },
        search:   { status: sRes.status,  body: sBody.slice(0, 1500) },
      }, null, 2), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (action === "test-mirror") {
      // Spiegel-Test: nimmt ein bestehendes canonical_fact, queued eine Episode
      // bei Graphiti (OHNE UUID — sonst NodeNotFoundError im Worker, validiert
      // 2026-05-13) und prüft, ob danach in Neo4j Episodic-Nodes erscheinen.
      // `graphiti_uuid` wird NICHT mehr gesetzt — Korrelation läuft über
      // `source_description`.
      const { canonical_fact_id, wait_ms } = body;
      if (!canonical_fact_id) throw new Error("canonical_fact_id required");
      const sbUrl = Deno.env.get("SUPABASE_URL")!;
      const sbKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const cfRes = await fetch(`${sbUrl}/rest/v1/canonical_facts?id=eq.${canonical_fact_id}&select=id,project_id,fact_type,content`, {
        headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
      });
      const cfArr = await cfRes.json();
      if (!Array.isArray(cfArr) || !cfArr.length) throw new Error("canonical_fact not found");
      const cf = cfArr[0];
      const gUrl = (Deno.env.get("GRAPHITI_SERVICE_URL") ?? "").replace(/\/+$/, "");
      const gBase = gUrl && !/^https?:\/\//i.test(gUrl) ? `https://${gUrl}` : gUrl;
      const gToken = Deno.env.get("GRAPHITI_SERVICE_TOKEN") ?? "";
      const c = cf.content ?? {};
      const title = (c as any).title?.toString().trim() || cf.fact_type;
      const rest = Object.entries(c).filter(([k,v]) => k !== "title" && v != null && v !== "")
        .map(([k,v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`).join(" · ");
      const episodeContent = rest ? `${title} — ${rest}` : title;
      const sourceDesc = `canonical_fact:${cf.id}`;
      const epRes = await fetch(`${gBase}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(gToken ? { Authorization: `Bearer ${gToken}` } : {}) },
        body: JSON.stringify({
          group_id: cf.project_id,
          messages: [{
            content: episodeContent, role_type: "system", role: "produktintelligenz",
            name: `${cf.fact_type}:${cf.id.slice(0,8)}`,
            source_description: sourceDesc,
            timestamp: new Date().toISOString(),
            // KEIN uuid-Feld — Server generiert selbst.
          }],
        }),
      });
      const epStatus = epRes.status;
      const epBody = await epRes.text();

      // Optional: warten und dann via /episodes prüfen ob die Episode in
      // Graphiti angekommen + verarbeitet wurde.
      const waitMs = typeof wait_ms === "number" ? Math.min(wait_ms, 60000) : 0;
      let episodesProbe: unknown = null;
      if (waitMs > 0) {
        await new Promise((r) => setTimeout(r, waitMs));
        const epListRes = await fetch(`${gBase}/episodes/${encodeURIComponent(cf.project_id)}?last_n=20`, {
          headers: gToken ? { Authorization: `Bearer ${gToken}` } : {},
        });
        const epListBody = await epListRes.text();
        episodesProbe = { status: epListRes.status, body: epListBody.slice(0, 800) };
      }

      return new Response(JSON.stringify({
        canonical_fact_id: cf.id, project_id: cf.project_id,
        episode_content: episodeContent.slice(0, 200),
        source_description: sourceDesc,
        graphiti_post: { status: epStatus, body: epBody.slice(0, 300) },
        episodes_after_wait: episodesProbe,
        note: "graphiti_uuid is NOT set anymore — server-generated, retrievable via source_description match.",
      }, null, 2), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (action === "test-aol") {
      // Direkter /aol/run-Aufruf mit dem Supabase-seitigen AOL_SERVICE_TOKEN.
      const token = Deno.env.get("AOL_SERVICE_TOKEN");
      const base = (Deno.env.get("AOL_SERVICE_URL") ?? "").replace(/\/+$/, "");
      const url = base && !/^https?:\/\//i.test(base) ? `https://${base}` : base;
      if (!token || !url) throw new Error("AOL_SERVICE_TOKEN/URL missing");
      const { project_id, asset_id, user_id, trigger_type } = body;
      const r = await fetch(`${url}/aol/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          project_id, asset_id, user_id,
          trigger_type: trigger_type ?? "reuse_check_test",
        }),
      });
      const text = await r.text();
      let parsed: unknown = text;
      try { parsed = JSON.parse(text); } catch { /* keep raw */ }
      return new Response(JSON.stringify({ status: r.status, body: parsed }, null, 2), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (action === "sync-supabase-to-railway") {
      // Drückt die kanonischen Supabase-Secret-Werte in Railway-Vars (Service folgt Cloud).
      // Pro Service eine Allowlist, damit wir keine fremden Vars überschreiben.
      const { projectId, environmentId, services } = body as {
        projectId: string; environmentId: string;
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
        out.push({ service: svc.serviceName, set: r.map((x: any) => ({ name: x.name, prefix: prefix(x.value) })), deploy: dep });
      }
      return new Response(JSON.stringify({ ok: true, services: out }, null, 2), { headers: { ...cors, "Content-Type": "application/json" } });
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
