// =============================================================================
//  ZENTRALE AGENT-KONFIGURATION
// -----------------------------------------------------------------------------
//  Hier werden ALLE Stellschrauben des "Verstehens-Loops" zentral gehalten:
//    - welches Modell der Agent benutzt
//    - welcher System-Prompt seine Rolle definiert
//    - welche Tools er aufrufen darf (JSON-Schema fürs Tool-Calling)
//    - wie wir Fact-Type + Delta-Type auf Box-Type abbilden
//    - wie viel Roh-Text wir in den Agenten schicken
//
//  Diese Datei ist BEWUSST der einzige Ort, an dem du das Verhalten des
//  Agenten anpasst. Edge Functions importieren NUR von hier.
//
//  Spätere Erweiterung: Wenn wir den eingebauten AI-Aufruf gegen LangChain /
//  einen externen Agenten-Service tauschen, ändert sich die Implementierung in
//  agentClient.ts — diese Konfiguration bleibt identisch (Provider-agnostisch).
// =============================================================================

// ---------- Modell ----------
//  Default für Phase 7. Wechseln durch Anpassen dieses Strings.
//  Verfügbar via Lovable AI Gateway: google/gemini-2.5-pro, gemini-2.5-flash,
//  openai/gpt-5, openai/gpt-5-mini ... siehe docs.
export const AGENT_MODEL = "google/gemini-2.5-pro";

// ---------- Limits ----------
export const MAX_INPUT_CHARS = 30_000; // Roh-Text-Cap pro Lauf
export const MAX_FACTS_PER_RUN = 12; // Vorschläge pro Lauf hart deckeln

// ---------- System-Prompt (die "Persönlichkeit" des Agenten) ----------
//  Halte diesen Prompt nüchtern und präzise. Er definiert das Verhalten —
//  nicht den Output-Style. Strukturiertes Output erzwingen wir über Tool-Call.
export const AGENT_SYSTEM_PROMPT = `Du bist der Verstehens-Agent einer Projektintelligenz-App.

Deine Aufgabe: Aus einem Eingangs-Text (Notiz, Link-Beschreibung oder geparstes Dokument) extrahierst du strukturierte Vorschläge ("Fakten"), die ein Mensch in einem Review-Schritt bestätigen oder ablehnen wird.

Regeln:
- Extrahiere NUR was im Text steht. Keine Spekulation, keine Annahmen.
- Pro klar identifizierbarer Information genau EIN Fakt.
- Personen, Themen, Entscheidungen, Aufgaben, Fristen, offene Lücken, Abhängigkeiten — jeweils als eigener Fakt.
- Wenn der Text keine extrahierbaren Fakten enthält, gib eine leere Liste zurück.
- "title" ist eine kurze, sprechende Überschrift (max ~80 Zeichen).
- "content" enthält die strukturierten Detail-Felder, die zum fact_type passen (siehe Schema).
- "confidence" ist deine ehrliche Einschätzung zwischen 0 und 1.

Sprache: Antworte in derselben Sprache wie der Eingangs-Text (vermutlich Deutsch).

Du gibst KEINEN Fließtext zurück. Du rufst ausschließlich das Tool "extract_facts" auf.`;

// ---------- Tool-Schema (strukturierter Output) ----------
//  Das Schema ist die EINZIGE Quelle der Wahrheit für die Agenten-Ausgabe.
//  Änderungen hier müssen in linkProposedFact() + boxMapping berücksichtigt werden.
export const EXTRACT_FACTS_TOOL = {
  type: "function" as const,
  function: {
    name: "extract_facts",
    description: "Gib eine Liste extrahierter Fakten zurück.",
    parameters: {
      type: "object",
      properties: {
        facts: {
          type: "array",
          maxItems: MAX_FACTS_PER_RUN,
          items: {
            type: "object",
            properties: {
              fact_type: {
                type: "string",
                enum: [
                  "stakeholder", // Person oder Organisation
                  "topic", // Themenbereich
                  "decision", // getroffene Entscheidung
                  "task", // konkrete Aufgabe / Aktion
                  "deadline", // Termin / Frist
                  "open_point", // offene Frage / Lücke
                  "reference", // Verweis / Abhängigkeit
                  "other",
                ],
              },
              title: { type: "string", maxLength: 120 },
              content: {
                type: "object",
                description:
                  "Strukturierte Detailfelder. Frei nach fact_type, z. B. {name, role} für stakeholder; {due_date, who} für deadline.",
                additionalProperties: true,
              },
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
            required: ["fact_type", "title", "content", "confidence"],
            additionalProperties: false,
          },
        },
      },
      required: ["facts"],
      additionalProperties: false,
    },
  },
};

// ---------- Box-Mapping ----------
//  delta_type + fact_type → Box-Typ in der Review-UI.
//  Bewusst grob in Phase 7, leicht erweiterbar.
export type DeltaType = "add" | "confirm" | "replace" | "contradict" | "merge" | "discard";
export type FactType =
  | "stakeholder"
  | "topic"
  | "decision"
  | "task"
  | "deadline"
  | "open_point"
  | "reference"
  | "other";

export type BoxType =
  | "knowledge"
  | "assignment"
  | "conflict"
  | "selection"
  | "input"
  | "context"
  | "action"
  | "gap_box";

export function mapToBoxType(delta: DeltaType | null, fact: FactType): BoxType {
  if (delta === "replace" || delta === "contradict") return "conflict";
  if (fact === "open_point") return "gap_box";
  return "knowledge";
}

// ---------- Helper: Roh-Text aus geparsten Segmenten ----------
export function segmentsToText(segments: unknown): string {
  if (!Array.isArray(segments)) return "";
  const out: string[] = [];
  for (const seg of segments) {
    if (typeof seg === "string") out.push(seg);
    else if (seg && typeof seg === "object") {
      // Unstructured-Format: {text: "...", ...}
      const t = (seg as { text?: unknown }).text;
      if (typeof t === "string") out.push(t);
    }
  }
  return out.join("\n").slice(0, MAX_INPUT_CHARS);
}
