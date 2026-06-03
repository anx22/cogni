// =============================================================================
//  Entity-Core — geteilte Typen & öffentlicher Vertrag.
//  Reines Modul (kein React, kein Supabase). Spec: docs/entity-core.md.
// =============================================================================

/** Lifecycle-State (System-getrieben) — unverändert ggü. orbPresets, damit
 *  Presets/OrbLab/DB-Rows gültig bleiben. */
export type EntityState =
  | "idle"
  | "hover"
  | "processing"
  | "review-ready"
  | "failed"
  | "busy-blocked";

/** Eingabe-Modi. Kanonisch hier; `components/entity/InputPills` sollte später
 *  von hier re-exportieren statt eigene Kopie zu halten. */
export type InputMode = "note" | "link" | "file" | "voice";

/** Interaction-Mode (User-getrieben). */
export type InteractionMode =
  | "resting"
  | "open"
  | "compose:note"
  | "compose:link"
  | "compose:file"
  | "compose:voice";

export type IntakeFailReason = "error" | "rate_limited" | "payment_required";

/** Semantische Signale — andere Module melden „was passiert ist", die Machine
 *  entscheidet den Zustand. Niemand setzt EntityState direkt. */
export type EntitySignal =
  | { kind: "intake.started"; inputType?: string }
  | { kind: "intake.progress" }
  | { kind: "intake.failed"; assetId?: string; reason?: IntakeFailReason }
  | { kind: "intake.empty" }
  | { kind: "intake.settle" }
  | { kind: "review.ready"; sessionId: string }
  | { kind: "review.opened"; sessionId?: string }
  | { kind: "review.dismissed" }
  | { kind: "drag.enter" }
  | { kind: "drag.leave" }
  | { kind: "drop" }
  | { kind: "system.blocked" }
  | { kind: "system.unblocked" }
  | { kind: "user.acknowledge" }
  | { kind: "proactive"; intent?: string }; // reservierter Slot (Umsetzung später)

/** Bewegungs-Signaturen: Achse-1-States + Achse-2-Modi. */
export type MotionSignature =
  | "pulse"
  | "rotate"
  | "burst"
  | "tremor"
  | "dim"
  | "listen"
  | "focus"
  | "scan"
  | "intake";

export type Intensity = "subtle" | "medium" | "strong";
export type ExpressionTone = "default" | "working" | "ready" | "alert";

/** Ausdrucks-ViewModel (Bewegung). Palette kommt zur Laufzeit aus den Presets
 *  hinzu (spädere Phase) — die reine Ableitung liefert Signatur/Intensität/Tone. */
export interface ExpressionVM {
  state: EntityState;
  mode: InteractionMode;
  signature: MotionSignature;
  intensity: Intensity;
  tone: ExpressionTone;
}

export type CharacterId = "siri" | "face-pill";

export type StandardCapability = "state-expression" | "input-affordance" | "speak" | "a11y-shell";

export type MotionCapability = "pointer-follow" | "tilt-3d" | "eyes" | "gooey" | "custom-morph";

export interface ResolvedCapabilities {
  standard: StandardCapability[];
  motion: MotionCapability[];
}

/** Charakter-Manifest. Capability-Vertrag + Forward-Slots für spätere Phasen. */
export interface CharacterManifest {
  id: CharacterId;
  label: string;
  motion?: MotionCapability[];
  suppressCore?: MotionCapability[];
  /** Phase 4: überschreibt Signatur/Intensität/Tone je EntityState. */
  expressionTune?: Partial<Record<EntityState, Partial<ExpressionVM>>>;
  /** Phase 6: Sprachprofil (Register, Vokabular-Bias, Präsentations-Override). */
  voiceProfile?: { register?: string; vocabularyBias?: string };
}
