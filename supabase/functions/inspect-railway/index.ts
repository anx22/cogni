// =============================================================================
//  inspect-railway — Action-Dispatch via _shared/inspector.ts.
//  Liest Status + Logs des AOL-Service über die Railway Public GraphQL API.
// =============================================================================

import { fail } from "../_shared/inspect-auth.ts";
import { inspector } from "../_shared/inspector.ts";
import { createRailwayClient } from "../_shared/clients/railway.ts";

const requireClient = () => {
  const client = createRailwayClient();
  if (!client) return null;
  return client;
};

Deno.serve(
  inspector(
    "inspect-railway",
    {
      me: async () => {
        const client = requireClient();
        if (!client) return fail(500, "RAILWAY_API_TOKEN not configured");
        const data = await client.gql<{
          me: {
            name: string;
            email: string;
            projects: { edges: { node: { id: string; name: string } }[] };
          };
        }>(`query { me { name email projects { edges { node { id name } } } } }`);
        return { me: data.me };
      },

      projects: async () => {
        const client = requireClient();
        if (!client) return fail(500, "RAILWAY_API_TOKEN not configured");
        const data = await client.gql<{
          projects: {
            edges: {
              node: {
                id: string;
                name: string;
                services: { edges: { node: { id: string; name: string } }[] };
                environments: { edges: { node: { id: string; name: string } }[] };
              };
            }[];
          };
        }>(
          `query { projects { edges { node { id name services { edges { node { id name } } } environments { edges { node { id name } } } } } } }`,
        );
        return { projects: data.projects.edges.map((e) => e.node) };
      },

      deployments: async ({ body }) => {
        const client = requireClient();
        if (!client) return fail(500, "RAILWAY_API_TOKEN not configured");
        const projectId = body.project_id as string | undefined;
        const serviceId = body.service_id as string | undefined;
        const environmentId = body.environment_id as string | undefined;
        if (!projectId || !serviceId || !environmentId) {
          return fail(400, "project_id, service_id, environment_id required");
        }
        const data = await client.gql<{
          deployments: {
            edges: {
              node: { id: string; status: string; createdAt: string; staticUrl?: string };
            }[];
          };
        }>(
          `query($p: String!, $s: String!, $e: String!, $n: Int) {
         deployments(first: $n, input: { projectId: $p, serviceId: $s, environmentId: $e }) {
           edges { node { id status createdAt staticUrl } }
         }
       }`,
          {
            p: projectId,
            s: serviceId,
            e: environmentId,
            n: (body.limit as number | undefined) ?? 10,
          },
        );
        return { deployments: data.deployments.edges.map((e) => e.node) };
      },

      logs: async ({ body }) => {
        const client = requireClient();
        if (!client) return fail(500, "RAILWAY_API_TOKEN not configured");
        const deploymentId = body.deployment_id as string | undefined;
        if (!deploymentId) return fail(400, "deployment_id required");
        const data = await client.gql<{
          deploymentLogs: { message: string; severity?: string; timestamp: string }[];
        }>(
          `query($d: String!, $n: Int) { deploymentLogs(deploymentId: $d, limit: $n) { message severity timestamp } }`,
          { d: deploymentId, n: (body.limit as number | undefined) ?? 100 },
        );
        return { logs: data.deploymentLogs };
      },
    },
    { defaultAction: "me" },
  ),
);
