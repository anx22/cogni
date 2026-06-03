// =============================================================================
//  Entity-Core — ÖFFENTLICHE OBERFLÄCHE (Barrel).
//  Andere Module importieren AUSSCHLIESSLICH von "@/lib/entity".
//  Interne Module (machine, interaction, deriveExpression, capabilities,
//  signalMapping) werden NICHT re-exportiert — Kommunikation läuft über Signale
//  und (ab Phase 1) den Provider/das ViewModel. Wächst pro Phase.
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
  CharacterId,
  StandardCapability,
  MotionCapability,
  ResolvedCapabilities,
  CharacterManifest,
} from "./types";

export { entitySignal } from "./signals";
