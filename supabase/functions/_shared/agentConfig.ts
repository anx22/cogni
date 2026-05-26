// =============================================================================
//  ZENTRALE AGENT-KONFIGURATION
// -----------------------------------------------------------------------------
//  Hier werden ALLE Stellschrauben des "Verstehens-Loops" zentral gehalten:
//    - welches Modell der Agent benutzt
//    - welcher System-Prompt seine Rolle definiert
//    - welche Tools er aufrufen darf (JSON-Schema fürs Tool-Calling)
//    - wie wir Modality + Delta + Fact-Type auf Box-Type abbilden
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
export const ASSIGNMENT_CONFIDENT_THRESHOLD = 3;
export const ASSIGNMENT_UNCERTAIN_THRESHOLD = 1;

// ---------- Modalitäten (Sprechhandlungen) ----------
//  Jedes extrahierte Item trägt eine Modalität. Sie ist die zentrale Achse,
//  über die das Review-UI entscheidet, was es dem User vorlegt — siehe
//  docs/DECISIONS.md (Modalitäts-Vertrag) und mem://features/modality-matrix.
export const MODALITIES = [
  "assertion",
  "condition",
  "exclusion",
  "assumption",
  "suggestion",
  "question",
  "note",
  "relation",
  "attribute",
  "risk",
  "unclear",
] as const;
export type Modality = (typeof MODALITIES)[number];

// ---------- System-Prompt Extract (Fallback — Live-Quelle: LangSmith Hub) ----------
export const AGENT_SYSTEM_PROMPT_FALLBACK = `Du bist der Verstehens-Agent einer Projektintelligenz-App.

Deine Aufgabe: Aus einem Eingangs-Text extrahierst du strukturierte Vorschläge ("Fakten"),
die ein Mensch in einem Review-Schritt bestätigen oder ablehnen wird.

Regeln:
- Extrahiere NUR was im Text steht. Keine Spekulation.
- Pro klar identifizierbarer Information genau EIN Fakt.
- "title" ist eine kurze, sprechende Überschrift (max ~80 Zeichen).
- "content" enthält die strukturierten Detail-Felder zum fact_type.
- "confidence" ist deine ehrliche Einschätzung zwischen 0 und 1.

WICHTIG — Sprechhandlung ("modality") pro Fakt:
- "assertion"  = klare Behauptung (Standardfall)
- "condition"  = Bedingung/Voraussetzung; gilt nur in Kombi mit einem Bezugsobjekt
                 (z. B. "Angebot gilt nur, wenn …")
- "exclusion"  = Ausschluss/No-Go ("nicht enthalten", "ohne Postproduktion")
- "assumption" = Annahme/Hypothese ("wir gehen davon aus, dass …")
- "suggestion" = Vorschlag/Idee, noch nicht entschieden
- "question"   = echte Frage des Absenders an den User. DANN MUSS "asks" gesetzt sein.
- "note"       = informativer Hinweis, kein Pflicht-Click
- "relation"   = Beziehung zwischen zwei Entitäten ("X ist Agentur von Y")
- "attribute"  = Detail-Update an einem Bezugsobjekt (z. B. Preis gehört an "Angebot B")
- "risk"       = Risiko/Warnung ("falls X, dann droht Y")
- "unclear"    = du bist dir nicht sicher → der User darf klassifizieren

ZUSATZFELDER (immer mitliefern, leer ist erlaubt):
- "attaches_to": Klartext-Bezugsobjekt. Pflicht bei condition/exclusion/attribute/risk/relation, sonst null.
- "asks": exakte Frage an den User. NUR setzen, wenn du wirklich eine Antwort brauchst, sonst null.
- "understood": EIN Satz Klartext — was du verstanden hast.
- "evidence": wörtliches Quellfragment.

GOLDENE REGEL: Erzeuge KEIN Eingabefeld beim User durch Trick — wenn du keine konkrete
Frage hast, lass "asks" leer. Eine Bedingung ist KEINE Lücke.

Sprache: dieselbe wie der Eingangs-Text (meist Deutsch).
Du rufst ausschließlich das Tool "extract_facts" auf.`;

// ---------- System-Prompt Assignment (Fallback) ----------
export const ASSIGNMENT_SYSTEM_PROMPT_FALLBACK = `Du bist der Zuordnungs-Agent einer Projektintelligenz-App.

Aufgabe: Entscheide, zu welchem bestehenden Projekt der gegebene Text am besten gehört — oder ob es vermutlich ein neues Projekt ist.

Du bekommst:
1. Den Roh-Text
2. Eine kompakte Liste der vorhandenen Projekte (Name, Beschreibung, Themen, Stakeholder)
3. Lexikalische Vor-Hinweise

Regeln:
- Lehne dich an die lexikalischen Hinweise an, hinterfrage sie bei thematischer Diskrepanz.
- Wenn nichts wirklich passt: project_id = null.
- "confidence" zwischen 0 und 1.
- "reason_short" ist EIN kurzer deutscher Satz (max ~120 Zeichen).
- Wenn project_id=null: "suggested_new_name" MUSS ein knapper Projektname sein (max ~40 Zeichen).

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
              modality: { type: "string", enum: [...MODALITIES] },
              attaches_to: { type: ["string", "null"] },
              asks: { type: ["string", "null"] },
              understood: { type: "string", maxLength: 240 },
              evidence: { type: ["string", "null"] },
              title: { type: "string", maxLength: 120 },
              content: { type: "object", additionalProperties: true },
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
            required: ["fact_type", "modality", "title", "content", "confidence", "understood"],
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
        project_id: { type: ["string", "null"] },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        reason_short: { type: "string", maxLength: 160 },
        suggested_new_name: { type: ["string", "null"] },
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

// ---------- Typen + Mapping ----------
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
  | "gap_box"
  // Sprechhandlungs-Boxen
  | "condition"
  | "exclusion"
  | "assumption"
  | "suggestion"
  | "question"
  | "note"
  | "relation"
  | "attribute"
  | "risk"
  | "unclear";

/**
 * Generalistisches Box-Mapping mit Modalitäts-Priorität.
 *
 *   1. Konflikt (delta replace/contradict) gewinnt immer.
 *   2. Modality → eigene Box. Jede Sprechhandlung hat ihren eigenen Renderer
 *      mit eigener Default-Aktion. Damit entfällt die "alles ist Lücke"-Falle.
 *   3. Fallback (Altbestand ohne modality): open_point → gap_box, sonst knowledge.
 */
export function mapToBoxType(
  delta: DeltaType | null,
  fact: FactType,
  modality?: Modality | null,
): BoxType {
  if (delta === "replace" || delta === "contradict") return "conflict";
  switch (modality) {
    case "condition":
      return "condition";
    case "exclusion":
      return "exclusion";
    case "assumption":
      return "assumption";
    case "suggestion":
      return "suggestion";
    case "question":
      return "question";
    case "note":
      return "note";
    case "relation":
      return "relation";
    case "attribute":
      return "attribute";
    case "risk":
      return "risk";
    case "unclear":
      return "unclear";
    case "assertion":
      return "knowledge";
  }
  if (fact === "open_point") return "gap_box";
  return "knowledge";
}

/**
 * Stille Substanz: Fakten mit hoher Konfidenz, ohne `asks` und ohne Konflikt
 * wandern direkt in den Projektzustand — kein Klick nötig, im Review nur als
 * Sammelzeile sichtbar. Schwelle bewusst hoch, um Lautstärke zu reduzieren.
 */
export const SILENT_COMMIT_CONFIDENCE = 0.9;

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
