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
export const AGENT_MODEL = "google/gemini-2.5-pro";

// ---------- Limits ----------
export const MAX_INPUT_CHARS = 30_000;
export const MAX_FACTS_PER_RUN = 12;
export const AGENT_TIMEOUT_MS = 30_000;

// ---------- Projektzuordnung — Schwellen ----------
//  Lexikalischer Score:
//    +3 Treffer auf Projektname
//    +2 Treffer auf Stakeholder (verknüpft via project_stakeholder_links)
//    +2 Treffer auf Themen
//    +1 Treffer auf Org-Domain
export const ASSIGNMENT_CONFIDENT_THRESHOLD = 3; // ab hier auto-zuordnen
export const ASSIGNMENT_UNCERTAIN_THRESHOLD = 1; // 1..2 = unsicher → Auswahlbox

// ---------- System-Prompt Extract ----------
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

// ---------- System-Prompt Assignment ----------
export const ASSIGNMENT_SYSTEM_PROMPT = `Du bist der Zuordnungs-Agent einer Projektintelligenz-App.

Aufgabe: Entscheide, zu welchem bestehenden Projekt der gegebene Text am besten gehört — oder ob es vermutlich ein neues Projekt ist.

Du bekommst:
1. Den Roh-Text
2. Eine kompakte Liste der vorhandenen Projekte (Name, Beschreibung, Themen, Stakeholder)
3. Lexikalische Vor-Hinweise (welche Projekte hatten wörtliche Treffer und wie stark)

Regeln:
- Lehne dich an die lexikalischen Hinweise an, hinterfrage sie aber bei thematischer Diskrepanz.
- Wenn nichts wirklich passt: project_id = null (signalisiert "neues Projekt").
- "confidence" ist deine ehrliche Einschätzung zwischen 0 und 1.
- "reason_short" ist EIN kurzer Satz auf Deutsch, max ~120 Zeichen, der die Wahl erklärt — er wird dem Nutzer angezeigt.

Du rufst ausschließlich das Tool "suggest_project_assignment" auf.`;

// ---------- Tool-Schema Extract ----------
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
                  "stakeholder",
                  "topic",
                  "decision",
                  "task",
                  "deadline",
                  "open_point",
                  "reference",
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

// ---------- Tool-Schema Assignment ----------
export const SUGGEST_ASSIGNMENT_TOOL = {
  type: "function" as const,
  function: {
    name: "suggest_project_assignment",
    description:
      "Schlage das passende Projekt vor oder gib null zurück, wenn der Text vermutlich zu einem neuen Projekt gehört.",
    parameters: {
      type: "object",
      properties: {
        project_id: {
          type: ["string", "null"],
          description: "UUID des Projekts oder null für 'neues Projekt'.",
        },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        reason_short: { type: "string", maxLength: 160 },
        suggested_new_name: {
          type: ["string", "null"],
          description:
            "Wenn project_id=null: ein knapper Vorschlag für einen neuen Projektnamen, sonst null.",
        },
        alternatives: {
          type: "array",
          maxItems: 3,
          items: {
            type: "object",
            properties: {
              project_id: { type: "string" },
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
            required: ["project_id", "confidence"],
            additionalProperties: false,
          },
        },
      },
      required: ["project_id", "confidence", "reason_short"],
      additionalProperties: false,
    },
  },
};

// ---------- Box-Mapping ----------
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
      const t = (seg as { text?: unknown }).text;
      if (typeof t === "string") out.push(t);
    }
  }
  return out.join("\n").slice(0, MAX_INPUT_CHARS);
}
