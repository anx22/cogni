// =============================================================================
//  _shared/clients/langsmith.ts — minimaler LangSmith REST Client
// -----------------------------------------------------------------------------
//  EU-Region per default. `x-tenant-id` aus LANGSMITH_WORKSPACE_ID (oder
//  LANGSMITH_PROMPT_OWNER als Fallback). Liefert Helper für Runs + Roh-Fetch.
// =============================================================================

const BASE = (
  Deno.env.get("LANGSMITH_ENDPOINT") ??
  Deno.env.get("LANGSMITH_BASE_URL") ??
  "https://eu.api.smith.langchain.com"
).replace(/\/$/, "");

const PROJECT_DEFAULT = Deno.env.get("LANGCHAIN_PROJECT") ?? "produktintelligenz-aol";

export class LangSmithError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`LangSmith ${status}: ${body.slice(0, 300)}`);
    this.status = status;
    this.body = body;
  }
}

export interface LangSmithClient {
  base: string;
  project: string;
  fetch: (path: string, init?: RequestInit) => Promise<Response>;
  queryRuns: (filter: Record<string, unknown>) => Promise<unknown>;
  getRun: (runId: string) => Promise<unknown>;
}

export function createLangSmithClient(opts: { project?: string } = {}): LangSmithClient | null {
  const key = Deno.env.get("LANGSMITH_API_KEY");
  if (!key) return null;
  const project = opts.project ?? PROJECT_DEFAULT;
  const tenant = Deno.env.get("LANGSMITH_WORKSPACE_ID") ?? Deno.env.get("LANGSMITH_PROMPT_OWNER");

  const fetchFn = (path: string, init: RequestInit = {}): Promise<Response> => {
    const headers: Record<string, string> = {
      "x-api-key": key,
      "Content-Type": "application/json",
      ...((init.headers as Record<string, string>) ?? {}),
    };
    if (tenant) headers["x-tenant-id"] = tenant;
    return fetch(`${BASE}${path}`, { ...init, headers });
  };

  const handle = async (r: Response): Promise<unknown> => {
    const txt = await r.text();
    if (!r.ok) throw new LangSmithError(r.status, txt);
    return txt ? JSON.parse(txt) : null;
  };

  return {
    base: BASE,
    project,
    fetch: fetchFn,
    queryRuns: (filter) =>
      fetchFn("/runs/query", { method: "POST", body: JSON.stringify(filter) }).then(handle),
    getRun: (runId) => fetchFn(`/runs/${runId}`, { method: "GET" }).then(handle),
  };
}
