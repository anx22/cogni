// =============================================================================
//  AGENT-CLIENT (Provider-Adapter)
// -----------------------------------------------------------------------------
//  Diese Datei kapselt den eigentlichen KI-Aufruf. Aktuell: Lovable AI Gateway.
//  Später (LangChain, eigener Agent-Service, ...) tauschst du NUR diese Datei.
//
//  Vertrag nach außen:
//    - callExtractFacts(text)      → ExtractedFact[]
//    - callSuggestAssignment(input) → AssignmentSuggestion
//
//  Modell-, Prompt- und Schema-Details kommen aus agentConfig.ts.
// =============================================================================

import {
  AGENT_MODEL,
  AGENT_SYSTEM_PROMPT_FALLBACK,
  AGENT_TIMEOUT_MS,
  ASSIGNMENT_SYSTEM_PROMPT_FALLBACK,
  EXTRACT_FACTS_TOOL,
  SUGGEST_ASSIGNMENT_TOOL,
  type FactType,
} from "./agentConfig.ts";
import { getPrompt } from "./promptHub.ts";

export interface ExtractedFact {
  fact_type: FactType;
  title: string;
  content: Record<string, unknown>;
  confidence: number;
  // Sprechhandlungs-Vertrag (siehe docs/DECISIONS.md "Modalitäts-Vertrag").
  modality?: import("./agentConfig.ts").Modality;
  attaches_to?: string | null;
  asks?: string | null;
  understood?: string;
  evidence?: string | null;
}

export interface AssignmentSuggestion {
  project_id: string | null;
  confidence: number;
  reason_short: string;
  suggested_new_name?: string | null;
  alternatives?: { project_id: string; confidence: number }[];
}

export class AgentRateLimitError extends Error {
  constructor() { super("rate_limited"); }
}
export class AgentPaymentError extends Error {
  constructor() { super("payment_required"); }
}
export class AgentTimeoutError extends Error {
  constructor() { super("agent_timeout"); }
}

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callGateway(body: unknown): Promise<any> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY ist nicht gesetzt");

  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), AGENT_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") throw new AgentTimeoutError();
    throw err;
  } finally {
    clearTimeout(t);
  }

  if (res.status === 429) throw new AgentRateLimitError();
  if (res.status === 402) throw new AgentPaymentError();
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Agent gateway ${res.status}: ${txt.slice(0, 300)}`);
  }
  return res.json();
}

function parseToolArgs(data: any, expectedName: string): unknown {
  const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.name && toolCall.function.name !== expectedName) return null;
  const argsRaw = toolCall?.function?.arguments;
  if (!argsRaw) return null;
  try {
    return typeof argsRaw === "string" ? JSON.parse(argsRaw) : argsRaw;
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------------------
//  Extract Facts
// ----------------------------------------------------------------------------
export async function callExtractFacts(
  text: string,
  graphHint?: string | null,
): Promise<ExtractedFact[]> {
  // graphHint: kompakter Kontext aus dem Projekt-Graphen (Graphiti).
  // Wird – falls vorhanden – als zusätzliche System-Notiz vor den User-Text
  // gestellt. Pures Prompt-Enrichment, keine Schema-/Logikänderung.
  const prompt = await getPrompt("extract-facts", {
    fallback: AGENT_SYSTEM_PROMPT_FALLBACK,
    autoCreate: true,
  });
  const systemMessages: Array<{ role: "system"; content: string }> = [
    { role: "system", content: prompt.system },
  ];
  const trimmed = (graphHint ?? "").trim();
  if (trimmed) {
    systemMessages.push({
      role: "system",
      content:
        "Bekanntes aus dem Projekt-Wissensgraph (nur als Kontext, nicht zitieren, " +
        "nicht doppelt extrahieren):\n" + trimmed.slice(0, 4000),
    });
  }
  const data = await callGateway({
    model: AGENT_MODEL,
    messages: [
      ...systemMessages,
      { role: "user", content: text },
    ],
    tools: [EXTRACT_FACTS_TOOL],
    tool_choice: { type: "function", function: { name: "extract_facts" } },
  });
  console.warn(`agent.extract_facts prompt_version=${prompt.version} source=${prompt.source}`);

  const parsed = parseToolArgs(data, "extract_facts") as { facts?: unknown } | null;
  if (!parsed) return [];
  const facts = parsed.facts;
  if (!Array.isArray(facts)) return [];

  return facts
    .filter(
      (f): f is ExtractedFact =>
        !!f &&
        typeof (f as ExtractedFact).fact_type === "string" &&
        typeof (f as ExtractedFact).title === "string" &&
        typeof (f as ExtractedFact).content === "object" &&
        typeof (f as ExtractedFact).confidence === "number",
    )
    .map((f) => ({
      // Defaults für Alt-Antworten ohne modality.
      modality: (f as any).modality ?? "assertion",
      attaches_to: (f as any).attaches_to ?? null,
      asks: (f as any).asks ?? null,
      understood: (f as any).understood ?? f.title,
      evidence: (f as any).evidence ?? null,
      ...f,
    }));
}

// ----------------------------------------------------------------------------
//  Suggest Project Assignment
// ----------------------------------------------------------------------------
export interface AssignmentInput {
  text: string;
  projects: {
    id: string;
    name: string;
    description?: string | null;
    topics?: string[];
    stakeholder_initials?: string[];
  }[];
  lexicalHints: {
    project_id: string;
    score: number;
    reasons: string[];
  }[];
}

export async function callSuggestAssignment(
  input: AssignmentInput,
): Promise<AssignmentSuggestion | null> {
  if (input.projects.length === 0) {
    return { project_id: null, confidence: 0.9, reason_short: "Noch keine Projekte vorhanden." };
  }

  const projectsBlock = input.projects
    .map((p) => {
      const parts = [`- ${p.name} (${p.id})`];
      if (p.description) parts.push(`  Beschreibung: ${p.description.slice(0, 200)}`);
      if (p.topics?.length) parts.push(`  Themen: ${p.topics.join(", ")}`);
      if (p.stakeholder_initials?.length) parts.push(`  Stakeholder: ${p.stakeholder_initials.join(", ")}`);
      return parts.join("\n");
    })
    .join("\n\n");

  const hintsBlock = input.lexicalHints.length
    ? input.lexicalHints
        .map((h) => `- ${h.project_id} · Score ${h.score} · ${h.reasons.join("; ")}`)
        .join("\n")
    : "(keine wörtlichen Treffer)";

  const userMsg = `## Roh-Text
${input.text.slice(0, 8000)}

## Vorhandene Projekte
${projectsBlock}

## Lexikalische Hinweise
${hintsBlock}`;

  const prompt = await getPrompt("suggest-assignment", {
    fallback: ASSIGNMENT_SYSTEM_PROMPT_FALLBACK,
    autoCreate: true,
  });
  const data = await callGateway({
    model: AGENT_MODEL,
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: userMsg },
    ],
    tools: [SUGGEST_ASSIGNMENT_TOOL],
    tool_choice: { type: "function", function: { name: "suggest_project_assignment" } },
  });
  console.warn(`agent.suggest_assignment prompt_version=${prompt.version} source=${prompt.source}`);

  const parsed = parseToolArgs(data, "suggest_project_assignment") as
    | AssignmentSuggestion
    | null;
  if (!parsed) return null;

  // Defensive Validierung
  const validIds = new Set(input.projects.map((p) => p.id));
  if (parsed.project_id && !validIds.has(parsed.project_id)) {
    parsed.project_id = null;
    parsed.reason_short = "Agent nannte unbekanntes Projekt — eher neues Projekt.";
  }
  return parsed;
}
