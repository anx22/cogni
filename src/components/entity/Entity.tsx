// =============================================================================
//  Entity — visuelle Entität. Wrapper um EntitySurface (Punktraster dahinter)
//  und SiriOrb (der Orb selbst). Sample-basiert: jeder State-Wechsel rollt
//  neue Werte aus dem aktuellen Range-Profil.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import SiriOrb from "./SiriOrb";
import EntitySurface from "./EntitySurface";
import {
  useOrbPresets,
  samplePreset,
  ORB_PRESETS_DEFAULT,
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
  const { presets } = useOrbPresets();
  const [internal, setInternal] = useState<EntityState>(state);
  const [sample, setSample] = useState<SampledPreset>(() =>
    samplePreset(ORB_PRESETS_DEFAULT[state]),
  );

  useEffect(() => {
    setInternal(state);
  }, [state]);

  // Re-sample on state change OR when the preset definition for the active state changes.
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

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Surface sits behind the orb, scaled larger than it. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <EntitySurface orbSize={orbPx} surface={active.surface} />
      </div>

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
    </div>
  );
};

export default Entity;
