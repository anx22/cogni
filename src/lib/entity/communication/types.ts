// =============================================================================
//  Entity-Core — Kommunikation (dritte Säule), Typen.
//  Reines Modul (kein React, kein Supabase). Spec: docs/entity-core.md §Kommunikation.
// =============================================================================

/** Anzeige-Ton der Stimme (steuert Farbe in EntityVoiceLine). */
export type UtteranceTone = "calm" | "working" | "ready" | "alert";

/** Was die Entität sagt — fertig zum Rendern. */
export interface Utterance {
  text: string;
  tone: UtteranceTone;
  /** Bei Fehlern: Asset, das ein Retry anbietet. */
  retryAssetId?: string | null;
}

/** Vokabular-Schlüssel. Ein Intent → mehrere Varianten (Anti-Repeat). */
export type Intent =
  | "intake.note"
  | "intake.doc"
  | "intake.other"
  | "processing.note"
  | "processing.doc"
  | "understanding.running"
  | "understanding.empty"
  | "understanding.failed"
  | "understanding.rate_limited"
  | "understanding.payment_required"
  | "proposed.first"
  | "review.ready";

/** Priorität für Coalesce + Chattiness-Gating. */
export type UtterancePriority = "alert" | "ready" | "working" | "ambient";

/** Auslöser aus dem Signal-Stream (rein, aus Realtime-Rows abgeleitet). */
export interface UtteranceTrigger {
  intent: Intent;
  /** Slot-Werte für Template-Platzhalter, z.B. { n: 3 }. */
  slots?: Record<string, string | number>;
  /** LLM-Override (höchste Priorität bei review.ready). */
  agentReason?: string | null;
  retryAssetId?: string | null;
}

/** Sonderbefehl: Stimme abräumen (Session geschlossen). */
export interface ClearTrigger {
  clear: true;
}

export type CommunicationInput = UtteranceTrigger | ClearTrigger;

export function isClear(input: CommunicationInput): input is ClearTrigger {
  return (input as ClearTrigger).clear === true;
}

/** Gesprächigkeit — user-scope, Default balanced. */
export type Chattiness = "quiet" | "balanced" | "chatty";

export interface UtterancePolicy {
  chattiness: Chattiness;
}

/** Sprachprofil je Charakter (Forward-Slot; Register/Bias später voll genutzt). */
export interface VoiceProfile {
  register?: string;
  vocabularyBias?: string;
}

/** Ergebnis von deriveUtterance — diskriminiert, damit „leer" eindeutig ist. */
export type DeriveResult =
  | { action: "show"; utterance: Utterance; intent: Intent; variantIndex: number }
  | { action: "clear" }
  | { action: "skip" };
