// =============================================================================
//  PROMPT HUB LOADER (LangSmith)
// -----------------------------------------------------------------------------
//  Holt System-Prompts live aus LangSmith Prompt Hub, mit:
//   - In-Memory-Cache (TTL 5 Min)
//   - Variablen-Substitution ({key} → value)
//   - Auto-Erstellung der Repo + erstem Commit aus Fallback (idempotent)
//   - Fallback auf Code-Default bei Fehler/Timeout — wirft NIE
//
//  Jede Antwort enthält {system, version}. Der `version`-Hash kann in den
//  LangSmith-Trace als Tag mitgeschickt werden, damit man pro Run nachvollzieht
//  welcher Prompt lief.
//
//  ENV (offizielle LangSmith-SDK-Namen):
//    LANGSMITH_API_KEY       (Pflicht für Hub-Pulls; ohne → immer Fallback)
//    LANGSMITH_ENDPOINT      (EU: https://eu.api.smith.langchain.com)
//    LANGSMITH_WORKSPACE_ID  (Pflicht bei workspace/org-scoped Keys; wird als x-tenant-id gesendet)
// =============================================================================

// Offizieller SDK-Default ist US; dieser Account liegt EU, daher EU als Projekt-Default.
// LANGSMITH_BASE_URL bleibt nur als Legacy-Fallback für bereits gesetzte Secrets erhalten.
const HUB_BASE = (Deno.env.get("LANGSMITH_ENDPOINT") ??
  Deno.env.get("LANGSMITH_BASE_URL") ??
  "https://eu.api.smith.langchain.com").replace(/\/$/, "");
const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 2_000;

interface CachedPrompt {
  template: string;
  version: string;
  fetchedAt: number;
}

const cache = new Map<string, CachedPrompt>();
const ensuredRepos = new Set<string>();

export interface PromptResult {
  system: string;
  version: string; // commit-hash oder "fallback" oder "cache-miss"
  source: "hub" | "cache" | "fallback";
}

export interface GetPromptOptions {
  variables?: Record<string, string>;
  fallback: string;
  /** Wenn true: erstelle Repo + initialen Commit aus Fallback wenn nicht vorhanden. */
  autoCreate?: boolean;
}

// ----------------------------------------------------------------------------

function authHeaders(): Record<string, string> {
  const key = Deno.env.get("LANGSMITH_API_KEY");
  if (!key) return {};
  const headers: Record<string, string> = { "x-api-key": key };
  const workspaceId = Deno.env.get("LANGSMITH_WORKSPACE_ID");
  if (workspaceId) headers["x-tenant-id"] = workspaceId;
  return headers;
}

async function withTimeout(p: Promise<Response>, ms: number): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    return await p;
  } finally {
    clearTimeout(t);
  }
}

// Offizielle SDK-Regel: private Prompts werden ohne Owner angegeben; intern wird Owner "-" verwendet.
// Siehe parseHubIdentifier(): "name" → ["-", "name", "latest"]. Kein Tenant-Handle erraten.
const PRIVATE_OWNER = "-";

// LangSmith ChatPromptTemplate-Manifest mit einer einzigen System-Message bauen.
function buildChatManifest(template: string): unknown {
  return {
    lc: 1,
    type: "constructor",
    id: ["langchain", "prompts", "chat", "ChatPromptTemplate"],
    kwargs: {
      messages: [
        {
          lc: 1,
          type: "constructor",
          id: ["langchain", "prompts", "chat", "SystemMessagePromptTemplate"],
          kwargs: {
            prompt: {
              lc: 1,
              type: "constructor",
              id: ["langchain", "prompts", "prompt", "PromptTemplate"],
              kwargs: {
                template,
                input_variables: extractVariables(template),
                template_format: "f-string",
              },
            },
          },
        },
      ],
      input_variables: extractVariables(template),
    },
  };
}

function extractVariables(template: string): string[] {
  const found = new Set<string>();
  const re = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template)) !== null) found.add(m[1]);
  return Array.from(found);
}

// Aus dem zurückgelieferten Manifest die System-Template-Strings rauslesen.
function extractSystemTemplate(manifest: any): string | null {
  try {
    const messages = manifest?.kwargs?.messages;
    if (!Array.isArray(messages)) return null;
    const parts: string[] = [];
    for (const msg of messages) {
      const tmpl =
        msg?.kwargs?.prompt?.kwargs?.template ??
        (typeof msg?.kwargs?.template === "string" ? msg.kwargs.template : null) ??
        (typeof msg?.kwargs?.content === "string" ? msg.kwargs.content : null);
      if (typeof tmpl === "string" && tmpl.length > 0) parts.push(tmpl);
    }
    return parts.length ? parts.join("\n\n") : null;
  } catch {
    return null;
  }
}

function applyVariables(tmpl: string, vars?: Record<string, string>): string {
  if (!vars) return tmpl;
  return tmpl.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (_, k) =>
    Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : `{${k}}`,
  );
}

async function ensureRepo(
  owner: string,
  name: string,
  fallback: string,
): Promise<void> {
  const key = `${owner}/${name}`;
  if (ensuredRepos.has(key)) return;
  const headers = { ...authHeaders(), "Content-Type": "application/json" };
  // 1. Repo anlegen (ignoriert wenn schon existiert).
  try {
    await withTimeout(
      fetch(`${HUB_BASE}/api/v1/repos/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          repo_handle: name,
          description: `Auto-created by Produktintelligenz: ${name}`,
          is_public: false,
        }),
      }),
      FETCH_TIMEOUT_MS,
    );
  } catch (e) {
    console.warn("promptHub: repo create failed (maybe exists):", e);
  }
  // 2. Initialen Commit aus Fallback schreiben.
  try {
    await withTimeout(
      fetch(`${HUB_BASE}/api/v1/commits/${owner}/${name}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          manifest: buildChatManifest(fallback),
          parent_commit: null,
        }),
      }),
      FETCH_TIMEOUT_MS,
    );
  } catch (e) {
    console.warn("promptHub: initial commit failed:", e);
  }
  ensuredRepos.add(key);
}

// ----------------------------------------------------------------------------

/**
 * Holt einen Prompt aus LangSmith Hub.
 *
 * @param name z. B. "extract-facts" — Tenant wird automatisch ermittelt
 * @param opts variables, fallback, autoCreate
 */
export async function getPrompt(
  name: string,
  opts: GetPromptOptions,
): Promise<PromptResult> {
  const fallbackResult = (): PromptResult => ({
    system: applyVariables(opts.fallback, opts.variables),
    version: "fallback",
    source: "fallback",
  });

  const headers = authHeaders();
  if (!headers["x-api-key"]) return fallbackResult();

  // 1. Cache
  const cacheKey = name;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return {
      system: applyVariables(cached.template, opts.variables),
      version: cached.version,
      source: "cache",
    };
  }

  // 2. Tenant + ggf. Auto-Create
  const owner = await getTenantHandle();
  if (!owner) return fallbackResult();
  if (opts.autoCreate) {
    await ensureRepo(owner, name, opts.fallback);
  }

  // 3. Pull latest commit
  try {
    const res = await withTimeout(
      fetch(`${HUB_BASE}/api/v1/commits/${owner}/${name}/latest`, { headers }),
      FETCH_TIMEOUT_MS,
    );
    if (!res.ok) {
      // 404 = nie committed → Fallback verwenden
      console.warn(`promptHub: pull ${name} → ${res.status}`);
      return fallbackResult();
    }
    const data = await res.json();
    const tmpl = extractSystemTemplate(data?.manifest);
    const version =
      typeof data?.commit_hash === "string"
        ? data.commit_hash.slice(0, 12)
        : "unknown";
    if (!tmpl) {
      console.warn(`promptHub: ${name} hat kein parsebares Template`);
      return fallbackResult();
    }
    cache.set(cacheKey, { template: tmpl, version, fetchedAt: Date.now() });
    return {
      system: applyVariables(tmpl, opts.variables),
      version,
      source: "hub",
    };
  } catch (e) {
    console.warn(`promptHub: pull ${name} failed:`, e);
    return fallbackResult();
  }
}

/** Cache komplett leeren — nützlich nach einem Hub-Edit für sofortige Sichtbarkeit. */
export function bustPromptCache(): { cleared: number } {
  const n = cache.size;
  cache.clear();
  return { cleared: n };
}

/** Status-Snapshot fürs Debugging. */
export function promptCacheState(): {
  tenant: string | null;
  entries: { name: string; version: string; ageMs: number }[];
} {
  const now = Date.now();
  return {
    tenant: cachedTenant,
    entries: Array.from(cache.entries()).map(([name, v]) => ({
      name,
      version: v.version,
      ageMs: now - v.fetchedAt,
    })),
  };
}
