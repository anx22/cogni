// =============================================================================
//  Entity — die visuelle Entität. Wrapper um SiriOrb.
//  Übernimmt Drop / Click / Review-Click und mappt App-States auf Orb-Presets.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import SiriOrb from "./SiriOrb";
import { ORB_PRESETS, modulateDuration, type EntityState } from "./orbPresets";

interface EntityProps {
  state?: EntityState;
  onDrop?: (files: File[]) => void;
  onClick?: () => void;
  onReviewClick?: () => void;
  busy?: boolean;
  /** Tonfall der Voice (calm | working | ready | alert) — beeinflusst Speed. */
  voiceTone?: string;
  size?: string;
}

const Entity = ({
  state = "idle",
  onDrop,
  onClick,
  onReviewClick,
  busy,
  voiceTone,
  size = "320px",
}: EntityProps) => {
  const [internal, setInternal] = useState<EntityState>(state);

  useEffect(() => {
    setInternal(state);
  }, [state]);

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

  const preset = ORB_PRESETS[internal] ?? ORB_PRESETS.idle;
  const duration = modulateDuration(preset.duration, voiceTone);

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
        colors={preset.colors}
        animationDuration={duration}
        className="pointer-events-none"
      />
    </button>
  );
};

export default Entity;
