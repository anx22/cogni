// =============================================================================
//  Entity-Core — Interaction-Mode (Achse 2), rein.
//  Mode-Reducer + Auto-Detect-Mapping. Die eigentliche Inhaltserkennung
//  (URL/Datei) liefert @/lib/intake/detectInputType; hier wird nur klassifiziert.
// =============================================================================

import type { InputMode, InteractionMode } from "./types";

export type InteractionAction =
  | { kind: "open" }
  | { kind: "close" }
  | { kind: "pick"; mode: InputMode }
  | { kind: "reset" };

export function interactionForMode(mode: InputMode): InteractionMode {
  return `compose:${mode}` as InteractionMode;
}

export function reduceInteraction(
  current: InteractionMode,
  action: InteractionAction,
): InteractionMode {
  switch (action.kind) {
    case "open":
      return current === "resting" ? "open" : current;
    case "pick":
      return interactionForMode(action.mode);
    case "close":
    case "reset":
      return "resting";
    default:
      return current;
  }
}

/**
 * Klassifiziert bereits ermittelte Eingabe-Merkmale zu einem InputMode — ohne
 * URL-Regex-Duplikat (der Aufrufer reicht `isUrl` aus detectInputType herein).
 * Priorität: Sprache > Datei > Link > Notiz.
 */
export function classifyInput(input: {
  hasFiles?: boolean;
  isVoice?: boolean;
  isUrl?: boolean;
}): InputMode {
  if (input.isVoice) return "voice";
  if (input.hasFiles) return "file";
  if (input.isUrl) return "link";
  return "note";
}
