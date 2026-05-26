// =============================================================================
//  inspect-langsmith — Action-Dispatch via _shared/inspector.ts.
//  Liefert Runs für eine session_name (typisch der LangGraph-thread_id =
//  aol_runs.id) — siehe https://api.smith.langchain.com/redoc.
// =============================================================================

import { fail } from "../_shared/inspect-auth.ts";
import { inspector } from "../_shared/inspector.ts";
import { createLangSmithClient } from "../_shared/clients/langsmith.ts";

Deno.serve(
  inspector(
    "inspect-langsmith",
    {
      list: async ({ body }) => {
        const client = createLangSmithClient();
        if (!client) return fail(500, "LANGSMITH_API_KEY not configured");
        const filter: Record<string, unknown> = {
          session: [client.project],
          limit: (body.limit as number | undefined) ?? 25,
          is_root: true,
        };
        const threadId = body.thread_id as string | undefined;
        if (threadId) {
          filter.filter = `eq(extra.metadata.thread_id, "${threadId}")`;
        }
        const data = (await client.queryRuns(filter)) as Record<string, unknown>;
        return { project: client.project, ...data };
      },

      get: async ({ body }) => {
        const client = createLangSmithClient();
        if (!client) return fail(500, "LANGSMITH_API_KEY not configured");
        const runId = body.run_id as string | undefined;
        if (!runId) return fail(400, "run_id required");
        const run = await client.getRun(runId);
        return { run };
      },
    },
    { defaultAction: "list" },
  ),
);
