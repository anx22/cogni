// =============================================================================
//  Entity-Core — Vokabular-Bank (rein).
//  Intent → Varianten[] mit Slots; deterministische Anti-Repeat-Auswahl.
//  Texte migriert aus dem alten useEntityVoice (1. Variante = Original).
// =============================================================================

import type { Intent, UtterancePriority, UtteranceTone } from "./types";

/** Mehrere Formulierungen je Intent. Slots in `{name}`-Klammern. */
export const VOCABULARY: Record<Intent, string[]> = {
  "intake.note": ["Ich nehme deine Notiz auf.", "Notiz kommt rein.", "Hab deine Notiz."],
  "intake.doc": ["Ich nehme deine Datei auf.", "Datei kommt rein.", "Hab dein Dokument."],
  "intake.other": ["Ich nehme deinen Input auf.", "Kommt rein.", "Hab’s aufgenommen."],
  "processing.note": ["Ich lese deine Notiz.", "Schau mir die Notiz an."],
  "processing.doc": ["Ich lese gerade dein Dokument.", "Arbeite mich durchs Dokument."],
  "understanding.running": ["Ich verstehe gerade.", "Denke nach.", "Sortiere das ein."],
  "understanding.empty": [
    "Nichts Neues entdeckt — Original ist gespeichert.",
    "Nichts Neues dabei — abgelegt ist es.",
  ],
  "understanding.failed": ["Das hat nicht geklappt — nochmal?", "Da ging was schief — nochmal?"],
  "understanding.rate_limited": [
    "Bin gerade überlastet — gleich nochmal?",
    "Kurz zu viel auf einmal — gleich nochmal?",
  ],
  "understanding.payment_required": ["Mir gehen die Credits aus.", "Die Credits sind alle."],
  "proposed.first": ["Ich erkenne etwas.", "Da ist was.", "Sehe einen Zusammenhang."],
  "review.ready": ["Bereit. {n} {sache} für dich.", "Fertig — {n} {sache} für dich."],
};

/** Fester Ton je Intent. */
export const INTENT_TONE: Record<Intent, UtteranceTone> = {
  "intake.note": "working",
  "intake.doc": "working",
  "intake.other": "working",
  "processing.note": "working",
  "processing.doc": "working",
  "understanding.running": "working",
  "understanding.empty": "calm",
  "understanding.failed": "alert",
  "understanding.rate_limited": "alert",
  "understanding.payment_required": "alert",
  "proposed.first": "working",
  "review.ready": "ready",
};

/** Priorität je Intent (Coalesce + Chattiness-Gating). */
export const INTENT_PRIORITY: Record<Intent, UtterancePriority> = {
  "intake.note": "working",
  "intake.doc": "working",
  "intake.other": "working",
  "processing.note": "working",
  "processing.doc": "working",
  "understanding.running": "working",
  "understanding.empty": "ambient",
  "understanding.failed": "alert",
  "understanding.rate_limited": "alert",
  "understanding.payment_required": "alert",
  "proposed.first": "working",
  "review.ready": "ready",
};

/** Füllt `{slot}`-Platzhalter; unbekannte Slots bleiben unverändert. */
export function fillSlots(template: string, slots?: Record<string, string | number>): string {
  if (!slots) return template;
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in slots ? String(slots[key]) : whole,
  );
}

/**
 * Wählt eine Variante deterministisch — vermeidet `prevIndex`, solange es
 * Alternativen gibt (Anti-Repeat). `seed` macht die Wahl reproduzierbar/testbar.
 * `prevIndex < 0` = noch nie gezeigt.
 */
export function pickVariant(
  variants: string[],
  prevIndex: number,
  seed: number,
): { index: number; text: string } {
  if (variants.length === 0) return { index: -1, text: "" };
  if (variants.length === 1) return { index: 0, text: variants[0] };
  // Kandidaten ohne den zuletzt gezeigten Index.
  const start = ((seed % variants.length) + variants.length) % variants.length;
  let index = start;
  if (index === prevIndex) index = (index + 1) % variants.length;
  return { index, text: variants[index] };
}
