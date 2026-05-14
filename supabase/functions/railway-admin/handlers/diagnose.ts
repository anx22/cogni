// =============================================================================
//  handlers/diagnose.ts — Supabase↔Railway-Vergleich + AOL-Health-Ping
// -----------------------------------------------------------------------------
//  diagnose — Verhalten 1:1 aus dem alten Monolithen.
// =============================================================================

import { type Handler, gql, jsonResponse, prefix } from "../_helpers.ts";

export const handlers: Record<string, Handler> = {
  "diagnose": async (body) => {
    const sb = {
      AOL_SERVICE_TOKEN: prefix(Deno.env.get("AOL_SERVICE_TOKEN")),
      GRAPHITI_SERVICE_TOKEN: prefix(Deno.env.get("GRAPHITI_SERVICE_TOKEN")),
      AOL_SERVICE_URL: Deno.env.get("AOL_SERVICE_URL") ?? null,
      GRAPHITI_SERVICE_URL: Deno.env.get("GRAPHITI_SERVICE_URL") ?? null,
      LANGSMITH_API_KEY: prefix(Deno.env.get("LANGSMITH_API_KEY")),
    };
    const aolVars = (await gql(
      `query($p:String!,$e:String!,$s:String!){variables(projectId:$p,environmentId:$e,serviceId:$s)}`,
      { p: body.projectId, e: body.environmentId, s: body.aolServiceId },
    )) as any;
    const rwAol = aolVars?.variables ?? {};
    const compare = {
      aol_token: {
        supabase: sb.AOL_SERVICE_TOKEN,
        railway: prefix(rwAol.AOL_SERVICE_TOKEN),
        match: prefix(Deno.env.get("AOL_SERVICE_TOKEN")) === prefix(rwAol.AOL_SERVICE_TOKEN),
      },
      langsmith: {
        supabase: sb.LANGSMITH_API_KEY,
        railway: prefix(rwAol.LANGSMITH_API_KEY),
        match: prefix(Deno.env.get("LANGSMITH_API_KEY")) === prefix(rwAol.LANGSMITH_API_KEY),
      },
      graphiti_url: {
        supabase: sb.GRAPHITI_SERVICE_URL,
        railway_aol: rwAol.GRAPHITI_SERVICE_URL ?? null,
        match: sb.GRAPHITI_SERVICE_URL === rwAol.GRAPHITI_SERVICE_URL,
      },
    };
    let aolPing: unknown = null;
    const aolUrl = (sb.AOL_SERVICE_URL ?? "").replace(/\/+$/, "");
    const aolHttps = aolUrl && !/^https?:\/\//i.test(aolUrl) ? `https://${aolUrl}` : aolUrl;
    if (aolHttps) {
      try {
        const r = await fetch(`${aolHttps}/health`);
        aolPing = { health_status: r.status, health_body: (await r.text()).slice(0, 200) };
      } catch (e) {
        aolPing = { error: String(e) };
      }
    }
    return jsonResponse({ supabase: sb, compare, aolPing });
  },
};
