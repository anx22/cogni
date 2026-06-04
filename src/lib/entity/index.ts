// =============================================================================
//  Entity-Core — ÖFFENTLICHE OBERFLÄCHE (Barrel).
//  Andere Module importieren AUSSCHLIESSLICH von "@/lib/entity".
//  Interne Maschinerie (machine, interaction, signalMapping) wird NICHT
//  re-exportiert — Kommunikation läuft über Signale und den Provider/das
//  ViewModel. Reine Ableitungen, die die Präsentation braucht (deriveExpression,
//  composeCapabilities), sind Teil der Oberfläche. Wächst pro Phase.
// =============================================================================

export type {
  EntityState,
  InputMode,
  InteractionMode,
  IntakeFailReason,
  EntitySignal,
  MotionSignature,
  Intensity,
  ExpressionTone,
  ExpressionVM,
  OrbPalette,
  CharacterId,
  StandardCapability,
  MotionCapability,
  ResolvedCapabilities,
  CharacterManifest,
} from "./types";

export { entitySignal } from "./signals";
export { EntityProvider } from "./EntityProvider";
export { useEntity } from "./useEntity";
export type { EntityContextValue, EntityController } from "./entityContext";
export { composeCapabilities, STANDARD_CAPABILITIES, DEFAULT_MOTION } from "./capabilities";
export { deriveExpression } from "./deriveExpression";

// Achse 2 — Interaction (Composer treibt den Mode über controller.interact).
export { classifyInput, type InteractionAction } from "./interaction";

// Dritte Säule — Kommunikation (Utterance liegt im ViewModel via useEntity().utterance).
export type { Utterance, UtteranceTone } from "./communication/types";
