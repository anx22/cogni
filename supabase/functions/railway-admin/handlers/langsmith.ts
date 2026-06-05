// =============================================================================
//  handlers/langsmith.ts — LangSmith-Debug/Probe-Actions
// -----------------------------------------------------------------------------
//  langsmith-raw, -key-info, -auth-matrix, -create-test-repo,
//  -tenant-resolve, -list-workspaces, -write-probe, -probe
//  Verhalten 1:1 aus dem alten Monolithen.
// =============================================================================

import { type Handler, jsonResponse } from "../_helpers.ts";

const defaultBase = () =>
  Deno.env.get("LANGSMITH_ENDPOINT") ??
  Deno.env.get("LANGSMITH_BASE_URL") ??
  "https://eu.api.smith.langchain.com";

export const handlers: Record<string, Handler> = {
  "langsmith-raw": async (body) => {
    const k = Deno.env.get("LANGSMITH_API_KEY") ?? "";
    const base = body.base ?? defaultBase();
    const path: string = body.path;
    const method: string = (body.method ?? "GET").toUpperCase();
    const extraHeaders: Record<string, string> = body.headers ?? {};
    const reqBody = body.body;
    const headers: Record<string, string> = { "x-api-key": k, ...extraHeaders };
    const workspaceId = Deno.env.get("LANGSMITH_WORKSPACE_ID");
    if (workspaceId && !Object.keys(headers).some((h) => h.toLowerCase() === "x-tenant-id")) {
      headers["x-tenant-id"] = workspaceId;
    }
    if (reqBody !== undefined && reqBody !== null && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    const r = await fetch(`${base}${path}`, {
      method,
      headers,
      body:
        reqBody !== undefined && reqBody !== null
          ? typeof reqBody === "string"
            ? reqBody
            : JSON.stringify(reqBody)
          : undefined,
    });
    const text = await r.text();
    return jsonResponse({ ok: true, status: r.status, body: text.slice(0, 1500) });
  },

  "langsmith-key-info": async () => {
    const k = Deno.env.get("LANGSMITH_API_KEY") ?? "";
    return jsonResponse({
      ok: true,
      present: !!k,
      length: k.length,
      prefix: k.slice(0, 8),
      suffix: k.slice(-4),
      endpoint: defaultBase(),
      workspace_id_present: !!Deno.env.get("LANGSMITH_WORKSPACE_ID"),
      owner_env_legacy: Deno.env.get("LANGSMITH_PROMPT_OWNER") ?? null,
    });
  },

  "langsmith-auth-matrix": async () => {
    const k = Deno.env.get("LANGSMITH_API_KEY") ?? "";
    const tenantHint =
      Deno.env.get("LANGSMITH_WORKSPACE_ID") ?? Deno.env.get("LANGSMITH_PROMPT_OWNER") ?? "";
    const base = defaultBase();
    const url = `${base}/api/v1/sessions?limit=1`;
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
    return jsonResponse({ ok: true, results: out });
  },

  "langsmith-create-test-repo": async (body) => {
    const k = Deno.env.get("LANGSMITH_API_KEY") ?? "";
    const base = body.base ?? defaultBase();
    const tid: string =
      body.tenant ??
      Deno.env.get("LANGSMITH_WORKSPACE_ID") ??
      Deno.env.get("LANGSMITH_PROMPT_OWNER") ??
      "";
    const headers: Record<string, string> = {
      "x-api-key": k,
      "Content-Type": "application/json",
    };
    if (/^[0-9a-f-]{36}$/i.test(tid)) headers["x-tenant-id"] = tid;
    const r = await fetch(`${base}/api/v1/repos/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        repo_handle: body.repo_handle ?? "produktintelligenz-probe",
        description: "Created by Cogni agent to verify write access",
        is_public: false,
      }),
    });
    const text = await r.text();
    return jsonResponse({
      ok: true,
      base,
      tenant: tid,
      status: r.status,
      body: text.slice(0, 800),
    });
  },

  "langsmith-tenant-resolve": async () => {
    const k = Deno.env.get("LANGSMITH_API_KEY") ?? "";
    const tid =
      Deno.env.get("LANGSMITH_WORKSPACE_ID") ?? Deno.env.get("LANGSMITH_PROMPT_OWNER") ?? "";
    const base = defaultBase();
    const headers = { "x-api-key": k, "x-tenant-id": tid };
    const paths = [
      "/api/v1/workspaces/current",
      "/api/v1/orgs/current",
      "/api/v1/info",
      "/api/v1/api-key/current",
    ];
    const out: Record<string, unknown> = {};
    for (const p of paths) {
      try {
        const r = await fetch(`${base}${p}`, { headers });
        out[p] = { status: r.status, body: (await r.text()).slice(0, 400) };
      } catch (e) {
        out[p] = { error: String(e) };
      }
    }
    return jsonResponse({ ok: true, results: out });
  },

  "langsmith-list-workspaces": async () => {
    const k = Deno.env.get("LANGSMITH_API_KEY") ?? "";
    const orgId = Deno.env.get("LANGSMITH_PROMPT_OWNER") ?? "";
    const base = defaultBase();
    const r = await fetch(`${base}/api/v1/workspaces?include_deleted=false`, {
      headers: {
        "X-API-Key": k,
        "X-Organization-Id": orgId,
      },
    });
    const text = await r.text();
    return jsonResponse({ ok: true, status: r.status, body: text.slice(0, 2000) });
  },

  "langsmith-write-probe": async () => {
    const key = Deno.env.get("LANGSMITH_API_KEY") ?? "";
    const base = defaultBase();
    const workspaceId = Deno.env.get("LANGSMITH_WORKSPACE_ID") ?? "";
    const headers: Record<string, string> = {
      "x-api-key": key,
      "Content-Type": "application/json",
    };
    if (workspaceId) headers["x-tenant-id"] = workspaceId;
    const r = await fetch(`${base}/api/v1/repos/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        repo_handle: "produktintelligenz-test-write",
        description: "write capability probe",
        is_public: false,
      }),
    });
    const t = await r.text();
    return jsonResponse({ ok: true, status: r.status, body: t.slice(0, 600) });
  },

  "langsmith-probe": async (body) => {
    const key = Deno.env.get("LANGSMITH_API_KEY") ?? "";
    if (!key) {
      return jsonResponse({ ok: false, error: "LANGSMITH_API_KEY missing" });
    }
    const base: string = body.base ?? defaultBase();
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
        const tid =
          tenantOverride ??
          Deno.env.get("LANGSMITH_WORKSPACE_ID") ??
          Deno.env.get("LANGSMITH_PROMPT_OWNER") ??
          "";
        const h: Record<string, string> = { "x-api-key": key };
        if (sendTenant && /^[0-9a-f-]{36}$/i.test(tid)) h["x-tenant-id"] = tid;
        const r = await fetch(`${base}${p}`, { headers: h });
        const t = await r.text();
        out[p] = { status: r.status, body: t.slice(0, 500) };
      } catch (e) {
        out[p] = { error: String(e) };
      }
    }
    return jsonResponse({ ok: true, base, sendTenant, results: out });
  },
};
