// =============================================================================
//  railway-admin/_helpers.ts — geteilte Utilities + Handler-Typ
// -----------------------------------------------------------------------------
//  - cors-Header (1:1 Verhalten wie vorher: Access-Control-Allow-* alle "*",
//    Methods POST,OPTIONS).
//  - jsonResponse() für einheitliche JSON-Antworten.
//  - gql()-Shim auf den geteilten Railway-Client.
//  - Wiederverwendete Railway-Operationen: listAll, projectDetails, setVars,
//    redeploy, autoDiscover (1:1 aus dem alten Monolithen extrahiert).
//  - HandlerCtx + Handler-Typ.
// =============================================================================

import type { Logger } from "../_shared/logger.ts";
import { createRailwayClient } from "../_shared/clients/railway.ts";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function jsonResponse(payload: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    ...init,
    headers: { ...cors, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

export function prefix(s: string | undefined | null): string | null {
  if (!s) return null;
  return `${s.slice(0, 8)}…(${s.length})`;
}

// Dünner Shim — gleiche Signatur wie vorher: gql(query, variables) -> data.
export async function gql<T = Record<string, unknown>>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const client = createRailwayClient();
  if (!client) throw new Error("RAILWAY_API_TOKEN missing");
  return await client.gql<T>(query, variables);
}

// ---- Railway-Operationen (wiederverwendet von mehreren Handlern) ------------

export async function listAll() {
  const ws = (await gql(`{ apiToken { workspaces { id name } } }`)) as any;
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

export async function projectDetails(projectId: string) {
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

export async function setVars(
  projectId: string,
  environmentId: string,
  serviceId: string,
  vars: Record<string, string>,
) {
  const out: Array<{ name: string; value: string; result: unknown }> = [];
  for (const [name, value] of Object.entries(vars)) {
    const r = await gql(
      `mutation($input: VariableUpsertInput!) { variableUpsert(input: $input) }`,
      { input: { projectId, environmentId, serviceId, name, value } },
    );
    out.push({ name, value, result: r });
  }
  return out;
}

export async function redeploy(serviceId: string, environmentId: string) {
  return await gql(
    `mutation($serviceId: String!, $environmentId: String!) {
       serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId)
     }`,
    { serviceId, environmentId },
  );
}

export async function autoDiscover(targetServiceName: string) {
  const data = (await listAll()) as any;
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

// ---- Handler-Vertrag --------------------------------------------------------

export interface HandlerCtx {
  log: Logger;
}

export type Handler = (body: any, ctx: HandlerCtx) => Promise<Response>;
