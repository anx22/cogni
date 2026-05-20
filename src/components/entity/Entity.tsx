// =============================================================================
//  Entity — visuelle Entität. Sample-basiert (Re-Roll bei State-Wechsel) und
//  delegiert das eigentliche Visual an einen austauschbaren Character.
//
//  Touch-Verhalten: kein Text-Select / iOS-Callout / Tap-Highlight. Beim
//  Bewegen des Fingers (oder der Maus) folgt der Wrapper dem Pointer mit
//  sanftem rAF-Damping und kehrt nach Loslassen smooth in die Ruhelage zurück.
//  Klicks bleiben unangetastet (kein preventDefault auf pointer-events).
// =============================================================================

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
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

const FOLLOW_MAX_OFFSET = 14; // px
const FOLLOW_DAMPING = 0.18;

/**
 * Pointer-Follow Hook: setzt translate3d direkt am Element via rAF.
 * Keine React-Re-Renders, kein preventDefault, respektiert reduced-motion.
 */
function usePointerFollow(ref: React.RefObject<HTMLElement>) {
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);
  const active = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const tick = () => {
      const dx = target.current.x - current.current.x;
      const dy = target.current.y - current.current.y;
      current.current.x += dx * FOLLOW_DAMPING;
      current.current.y += dy * FOLLOW_DAMPING;
      el.style.transform = `translate3d(${current.current.x.toFixed(2)}px, ${current.current.y.toFixed(2)}px, 0)`;

      const settled = Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05;
      if (settled && !active.current) {
        current.current.x = 0;
        current.current.y = 0;
        el.style.transform = "translate3d(0,0,0)";
        raf.current = null;
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };

    const ensureLoop = () => {
      if (raf.current == null) raf.current = requestAnimationFrame(tick);
    };

    const updateTarget = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      // Subtract current translation to get the natural (rest) center.
      // getBoundingClientRect reflects the painted position including any
      // in-flight translate3d — without this correction the target shrinks as
      // the element chases the pointer, creating a feedback oscillation.
      const naturalCx = rect.left + rect.width / 2 - current.current.x;
      const naturalCy = rect.top + rect.height / 2 - current.current.y;
      const nx = (clientX - naturalCx) / (rect.width / 2);
      const ny = (clientY - naturalCy) / (rect.height / 2);
      const clamp = (v: number) => Math.max(-1, Math.min(1, v));
      target.current.x = clamp(nx) * FOLLOW_MAX_OFFSET;
      target.current.y = clamp(ny) * FOLLOW_MAX_OFFSET;
      ensureLoop();
    };

    const reset = () => {
      active.current = false;
      target.current.x = 0;
      target.current.y = 0;
      ensureLoop();
    };

    const onPointerDown = (e: PointerEvent) => {
      active.current = true;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      updateTarget(e.clientX, e.clientY);
    };
    const onPointerMove = (e: PointerEvent) => {
      // Maus: nur bei Hover über Element folgen (sanft)
      // Touch/Pen: nach pointerdown via capture
      if (e.pointerType === "mouse" && !active.current) {
        // Hover-Tracking
        updateTarget(e.clientX, e.clientY);
        return;
      }
      if (active.current) updateTarget(e.clientX, e.clientY);
    };
    const onPointerEnd = () => reset();
    const onPointerLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && !active.current) reset();
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerEnd);
    el.addEventListener("pointercancel", onPointerEnd);
    el.addEventListener("pointerleave", onPointerLeave);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerEnd);
      el.removeEventListener("pointercancel", onPointerEnd);
      el.removeEventListener("pointerleave", onPointerLeave);
      if (raf.current != null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
  }, [ref]);
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  usePointerFollow(wrapperRef);

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

  const active = presetOverride ?? sample;
  const orbPx = Number.parseInt(size.replace("px", ""), 10) || 320;
  const Char = CHARACTERS[character] ?? CHARACTERS[DEFAULT_CHARACTER_ID];

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

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex items-center justify-center select-none"
      style={wrapperStyle}
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
        onPickInputMode,
      })}
    </div>
  );
};

export default Entity;
