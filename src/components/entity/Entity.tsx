// =============================================================================
//  Entity — visuelle Entität. Sample-basiert (Re-Roll bei State-Wechsel) und
//  delegiert das eigentliche Visual an einen austauschbaren Character.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import {
  useOrbPresets,
  samplePreset,
  ORB_PRESETS_DEFAULT,
  type EntityState,
  type SampledPreset,
} from "./orbPresets";
import { CHARACTERS, DEFAULT_CHARACTER_ID } from "./characters/registry";
import type { CharacterId } from "./characters/types";
import type { InputMode } from "./InputPills";

interface EntityProps {
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
  /** Wird aufgerufen, wenn ein Charakter einen Input-Mode-Picker hat (face-pill). */
  onPickInputMode?: (mode: InputMode) => void;
}

const Entity = ({
  state = "idle",
  onDrop,
  onClick,
  onReviewClick,
  busy,
  size = "320px",
  presetOverride,
  character = DEFAULT_CHARACTER_ID,
  onPickInputMode,
}: EntityProps) => {
  const { presets } = useOrbPresets();
  const [internal, setInternal] = useState<EntityState>(state);
  const [sample, setSample] = useState<SampledPreset>(() =>
    samplePreset(ORB_PRESETS_DEFAULT[state]),
  );

  useEffect(() => {
    setInternal(state);
  }, [state]);

  useEffect(() => {
    setSample(samplePreset(presets[internal]));
  }, [internal, presets]);

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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (busy) return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onDrop?.(files);
    },
    [onDrop, busy],
  );

  const handleClick = useCallback(() => {
    if (state === "review-ready") {
      onReviewClick?.();
      return;
    }
    onClick?.();
  }, [state, onClick, onReviewClick]);

  const active = presetOverride ?? sample;
  const orbPx = Number.parseInt(size.replace("px", ""), 10) || 320;
  const Char = CHARACTERS[character] ?? CHARACTERS[DEFAULT_CHARACTER_ID];

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      aria-label="Entität öffnen"
    >
      {Char.render({
        state: internal,
        size: orbPx,
        sample: active,
        onClick: handleClick,
        onPickInputMode,
      })}
    </div>
  );
};

export default Entity;
