// =============================================================================
//  Entity — visuelle Entität. Wrapper um SiriOrb.
//  Sample-basiert: jeder State-Wechsel rollt neue Werte aus dem Range-Profil.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import SiriOrb from "./SiriOrb";
import {
  ORB_PRESETS,
  samplePreset,
  type EntityState,
  type SampledPreset,
} from "./orbPresets";

interface EntityProps {
  state?: EntityState;
  onDrop?: (files: File[]) => void;
  onClick?: () => void;
  onReviewClick?: () => void;
  busy?: boolean;
  size?: string;
  /** Optional: erzwinge ein gesampletes Preset (z.B. für OrbLab). */
  presetOverride?: SampledPreset;
}

const Entity = ({
  state = "idle",
  onDrop,
  onClick,
  onReviewClick,
  busy,
  size = "320px",
  presetOverride,
}: EntityProps) => {
  const [internal, setInternal] = useState<EntityState>(state);
  const [sample, setSample] = useState<SampledPreset>(() =>
    samplePreset(ORB_PRESETS[state]),
  );

  useEffect(() => {
    setInternal(state);
  }, [state]);

  // Bei jedem Wechsel des sichtbaren States neue Werte würfeln.
  useEffect(() => {
    setSample(samplePreset(ORB_PRESETS[internal]));
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

  return (
    <button
      type="button"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      aria-label="Entität öffnen"
      className="relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-transform duration-300 hover:scale-[1.02] active:scale-[0.99]"
      style={{ width: size, height: size }}
    >
      <SiriOrb
        size={size}
        colors={active.colors}
        animationDuration={active.duration}
        className="pointer-events-none"
      />
    </button>
  );
};

export default Entity;
