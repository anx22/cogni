// =============================================================================
//  graphiti.ts  —  dünner TS-Client für den deployten graphiti-server
// -----------------------------------------------------------------------------
//  Wir sprechen direkt mit der offiziellen Graphiti-Server-REST-API
//  (https://github.com/getzep/graphiti, server/graph_service).
//
//  Wichtig:
//  - group_id = unsere project_id (UUID-String). So bleibt jeder Projekt-Graph
//    sauber getrennt.
//  - Bei jedem Call: Bearer-Auth via GRAPHITI_SERVICE_TOKEN (falls auf dem
//    Server konfiguriert; sonst leerer Header — schadet nicht).
//  - Aufrufer (Edge Functions, später AOL) sollen NICHT direkt fetchen,
//    sondern diese Helper benutzen.
// =============================================================================

// URL-Härtung: fehlendes Schema → https:// ergänzen, trailing slashes weg.
// So bricht Graphiti nicht still wegen "Invalid URL", wenn das Secret ohne
// Schema gesetzt wurde (häufiger Railway-Copy-Paste-Fehler).
function normalizeBase(raw: string): string {
  const t = raw.trim().replace(/\/+$/, "");
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  console.warn(
    "[graphiti] GRAPHITI_SERVICE_URL ohne Schema gesetzt — ergänze 'https://' automatisch.",
  );
  return `https://${t}`;
}

const BASE = normalizeBase(Deno.env.get("GRAPHITI_SERVICE_URL") ?? "");
const TOKEN = Deno.env.get("GRAPHITI_SERVICE_TOKEN") ?? "";

export class GraphitiUnavailableError extends Error {}
export class GraphitiHttpError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`Graphiti ${status}: ${body.slice(0, 300)}`);
    this.status = status;
    this.body = body;
  }
}

function url(path: string): string {
  if (!BASE) {
    throw new GraphitiUnavailableError(
      "GRAPHITI_SERVICE_URL nicht gesetzt — Wissensgraph offline",
    );
  }
  return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(url(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const txt = await res.text();
  if (!res.ok) throw new GraphitiHttpError(res.status, txt);
  if (!txt) return undefined as unknown as T;
  try {
    return JSON.parse(txt) as T;
  } catch {
    return txt as unknown as T;
  }
}

// ---------- Health ----------------------------------------------------------

export async function healthcheck(): Promise<{ status: string }> {
  return request("/healthcheck", { method: "GET" });
}

// ---------- Episoden hinzufügen --------------------------------------------
//
//  POST /messages
//  Body laut graph_service:
//    { group_id: str, messages: Message[] }
//  Message: { content: str, role_type: "user"|"assistant"|"system",
//             role?: str, name?: str, source_description?: str,
//             timestamp?: ISOString, uuid?: str }

export interface AddMessageInput {
  project_id: string;
  content: string;
  role_type?: "user" | "assistant" | "system";
  role?: string;
  name?: string;
  source_description?: string;
  timestamp?: string;
  uuid?: string;
}

// WICHTIG zur Semantik:
// Der Server-Endpoint /messages liefert HTTP 202 + { message, success } und
// queued das Episode-Processing asynchron (siehe getzep/graphiti server
// graph_service/routers/ingest.py). Es gibt KEINE Server-UUID im Response —
// der Aufrufer muss `uuid` selbst generieren und mitsenden, damit er die
// Verbindung zwischen Supabase-Datensatz und Graphiti-Episode behält.
// `addMessage` gibt deshalb die mitgesendete (oder neu generierte) UUID
// zurück, nicht das Server-Response-Body.
export async function addMessage(input: AddMessageInput): Promise<{ uuid: string; queued: true }> {
  const uuid = input.uuid ?? crypto.randomUUID();
  await request("/messages", {
    method: "POST",
    body: JSON.stringify({
      group_id: input.project_id,
      messages: [
        {
          content: input.content,
          role_type: input.role_type ?? "user",
          role: input.role,
          name: input.name,
          source_description: input.source_description,
          timestamp: input.timestamp ?? new Date().toISOString(),
          uuid,
        },
      ],
    }),
  });
  return { uuid, queued: true };
}

// ---------- Suche -----------------------------------------------------------
//
//  POST /search
//  Body: { query: str, group_ids?: string[], max_facts?: int, center_node_uuid?: str }

export interface SearchInput {
  query: string;
  project_ids?: string[];
  max_facts?: number;
  center_node_uuid?: string;
}

export interface SearchResult {
  facts?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export async function search(input: SearchInput): Promise<SearchResult> {
  return request("/search", {
    method: "POST",
    body: JSON.stringify({
      query: input.query,
      group_ids: input.project_ids,
      max_facts: input.max_facts ?? 20,
      center_node_uuid: input.center_node_uuid,
    }),
  });
}

// ---------- Memory / Projekt-Kontext ---------------------------------------
//
//  POST /get-memory   — Kompakter Prompt-fertiger Memory-Dump
//  GET  /episodes/{group_id}?last_n=N

export async function getMemory(input: {
  project_id: string;
  max_facts?: number;
  center_node_uuid?: string;
  messages?: Array<{ content: string; role_type: string }>;
}): Promise<Record<string, unknown>> {
  return request("/get-memory", {
    method: "POST",
    body: JSON.stringify({
      group_id: input.project_id,
      max_facts: input.max_facts ?? 20,
      center_node_uuid: input.center_node_uuid,
      messages: input.messages ?? [],
    }),
  });
}

export async function getEpisodes(
  project_id: string,
  last_n = 20,
): Promise<unknown> {
  return request(
    `/episodes/${encodeURIComponent(project_id)}?last_n=${last_n}`,
    { method: "GET" },
  );
}

// ---------- Entity-Anlage --------------------------------------------------
//
//  POST /entity-node
//  Body: { uuid: str, group_id: str, name: str, summary?: str }

export async function createEntityNode(input: {
  uuid: string;
  project_id: string;
  name: string;
  summary?: string;
}): Promise<unknown> {
  return request("/entity-node", {
    method: "POST",
    body: JSON.stringify({
      uuid: input.uuid,
      group_id: input.project_id,
      name: input.name,
      summary: input.summary ?? "",
    }),
  });
}

// ---------- Invalidation ---------------------------------------------------

export async function deleteEpisode(uuid: string): Promise<unknown> {
  return request(`/episode/${encodeURIComponent(uuid)}`, { method: "DELETE" });
}

export async function deleteEntityEdge(uuid: string): Promise<unknown> {
  return request(`/entity-edge/${encodeURIComponent(uuid)}`, {
    method: "DELETE",
  });
}

export async function deleteProjectGraph(project_id: string): Promise<unknown> {
  return request(`/group/${encodeURIComponent(project_id)}`, {
    method: "DELETE",
  });
}

// ---------- Convenience ----------------------------------------------------

export function isGraphitiConfigured(): boolean {
  return !!BASE;
}
