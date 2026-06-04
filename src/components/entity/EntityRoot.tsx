// =============================================================================
//  EntityRoot — visuelle Entität. Sample-basiert (Re-Roll bei State-Wechsel) und
//  delegiert das eigentliche Visual an einen austauschbaren Character.
//
//  Touch-Verhalten: kein Text-Select / iOS-Callout / Tap-Highlight.
//  Pointer-Follow via behaviors/usePointerFollow (nur wenn Manifest erlaubt).
//  A11y-Props via behaviors/useA11yShell (state-adaptiv, Enter/Space, aria-*).
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  useOrbPresets,
  samplePreset,
  ORB_PRESETS_DEFAULT,
  type EntityState,
  type SampledPreset,
} from "./presets/orbPresets";
import { CHARACTERS, DEFAULT_CHARACTER_ID } from "./characters/registry";
import type { CharacterId } from "./characters/types";
import type { InputMode } from "./InputPills";
import { composeCapabilities, deriveExpression, type InteractionMode } from "@/lib/entity";
import { usePointerFollow } from "./behaviors/usePointerFollow";
import { useA11yShell } from "./behaviors/useA11yShell";
import { SignatureLayer } from "./expression/SignatureLayer";

interface EntityRootProps {
  state?: EntityState;
  onDrop?: (files: File[]) => void;
  onClick?: () => void;
  onReviewClick?: () => void;
  busy?: boolean;
  size?: string;
  /** Optional: erzwinge ein gesampletes Preset (z.B. für OrbLab). */
  presetOverride?: SampledPreset;
  /** Welcher Charakter gerendert wird. Default: "siri". */
  character?: CharacterId;
  /** Interaction-Mode (Achse 2). Prägt zusammen mit dem State die Signatur. */
  mode?: InteractionMode;
  /** Wird aufgerufen, wenn ein Charakter einen Input-Mode-Picker hat (face-pill). */
  onPickInputMode?: (mode: InputMode) => void;
}

const EntityRoot = ({
  state = "idle",
  onDrop,
  onClick,
  onReviewClick,
  busy,
  size = "320px",
  presetOverride,
  character = DEFAULT_CHARACTER_ID,
  mode = "resting",
  onPickInputMode,
}: EntityRootProps) => {
  const { presets } = useOrbPresets();
  const [internal, setInternal] = useState<EntityState>(state);
  const [sample, setSample] = useState<SampledPreset>(() =>
    samplePreset(ORB_PRESETS_DEFAULT[state]),
  );
  const Char = CHARACTERS[character] ?? CHARACTERS[DEFAULT_CHARACTER_ID];
  const caps = useMemo(() => composeCapabilities(Char.manifest), [Char]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  usePointerFollow(wrapperRef, caps.motion.includes("pointer-follow"));

  // Achsen-Komposition: der innere State (inkl. transientem Drag-„hover") + der
  // Modus ergeben die aktuelle Bewegungs-Signatur.
  const vm = useMemo(() => deriveExpression(internal, mode), [internal, mode]);

  // Charaktere, die sich selbst morphen (custom-morph, z. B. FacePill), drücken
  // ihren Zustand eigenständig aus und bekommen KEINE generische Transform-
  // Signatur übergestülpt (Kollision mit Tilt-3d/Breathe). Siri & Co. ja.
  const wantsSignature = !Char.manifest.motion?.includes("custom-morph");

  useEffect(() => {
    setInternal(state);
  }, [state]);

  // presets-Referenz wechselt beim async `useNamespace("orb")`-DB-Load nach Mount.
  // Würden wir presets in die Deps nehmen, re-sampelt der Effect mitten in der
  // Rotationsanimation → CSS `siri-orb-rotate` startet neu (sichtbares Zucken).
  // Ref hält presets aktuell für den nächsten State-Wechsel, ohne Re-Sample auszulösen.
  const presetsRef = useRef(presets);
  useEffect(() => {
    presetsRef.current = presets;
  }, [presets]);

  useEffect(() => {
    setSample(samplePreset(presetsRef.current[internal]));
  }, [internal]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (busy) {
        e.dataTransfer.dropEffect = "none";
        return;
      }
      setInternal("hover");
    },
    [busy],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setInternal(state);
    },
    [state],
  );

  // Drop wird global vom useDropZone-Hook (window-Scope) verarbeitet.
  // Hier nur Hover-State zurücksetzen — keine doppelte Verarbeitung.
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setInternal(state);
      // onDrop bleibt im API-Vertrag, wird aber nicht aufgerufen — single source of truth ist window.
      void onDrop;
      void busy;
    },
    [onDrop, busy, state],
  );

  const handleClick = useCallback(() => {
    if (state === "review-ready") {
      onReviewClick?.();
      return;
    }
    onClick?.();
  }, [state, onClick, onReviewClick]);

  const a11y = useA11yShell(state, handleClick);
  const active = presetOverride ?? sample;
  const orbPx = Number.parseInt(size.replace("px", ""), 10) || 320;

  const wrapperStyle: CSSProperties = {
    width: size,
    height: size,
    touchAction: "manipulation",
    userSelect: "none",
    WebkitUserSelect: "none",
    WebkitTouchCallout: "none",
    WebkitTapHighlightColor: "transparent",
    willChange: "transform",
  };

  const characterNode = Char.render({
    state: internal,
    size: orbPx,
    sample: active,
    onPickInputMode,
  });

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex items-center justify-center select-none"
      style={wrapperStyle}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      {...a11y}
    >
      {wantsSignature ? (
        <SignatureLayer signature={vm.signature}>{characterNode}</SignatureLayer>
      ) : (
        characterNode
      )}
    </div>
  );
};

export default EntityRoot;
