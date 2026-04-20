// =============================================================================
//  AGENT-CLIENT (Provider-Adapter)
// -----------------------------------------------------------------------------
//  Diese Datei kapselt den eigentlichen KI-Aufruf. Aktuell: Lovable AI Gateway.
//  Später (LangChain, eigener Agent-Service, ...) tauschst du NUR diese Datei.
//
//  Vertrag nach außen: callExtractFacts(text) → ExtractedFact[]
//  Alle Modell-, Prompt- und Schema-Details kommen aus agentConfig.ts.
// =============================================================================

import {
  AGENT_MODEL,
  AGENT_SYSTEM_PROMPT,
  EXTRACT_FACTS_TOOL,
  type FactType,
} from "./agentConfig.ts";

export interface ExtractedFact {
  fact_type: FactType;
  title: string;
  content: Record<string, unknown>;
  confidence: number;
}

export class AgentRateLimitError extends Error {
  constructor() {
    super("rate_limited");
  }
}
export class AgentPaymentError extends Error {
  constructor() {
    super("payment_required");
  }
}

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export async function callExtractFacts(text: string): Promise<ExtractedFact[]> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY ist nicht gesetzt");

  const body = {
    model: AGENT_MODEL,
    messages: [
      { role: "system", content: AGENT_SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
    tools: [EXTRACT_FACTS_TOOL],
    tool_choice: { type: "function", function: { name: "extract_facts" } },
  };

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.status === 429) throw new AgentRateLimitError();
  if (res.status === 402) throw new AgentPaymentError();
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Agent gateway ${res.status}: ${t.slice(0, 300)}`);
  }

  const data = await res.json();
  const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
  const argsRaw = toolCall?.function?.arguments;
  if (!argsRaw) return [];

  let parsed: unknown;
  try {
    parsed = typeof argsRaw === "string" ? JSON.parse(argsRaw) : argsRaw;
  } catch {
    return [];
  }
  const facts = (parsed as { facts?: unknown }).facts;
  if (!Array.isArray(facts)) return [];

  // Defensive Filterung — was nicht ins Schema passt, fliegt raus.
  return facts.filter(
    (f): f is ExtractedFact =>
      !!f &&
      typeof (f as ExtractedFact).fact_type === "string" &&
      typeof (f as ExtractedFact).title === "string" &&
      typeof (f as ExtractedFact).content === "object" &&
      typeof (f as ExtractedFact).confidence === "number",
  );
}
