// =============================================================================
//  FacePillCharacter — Squircle-Pill mit blinzelnden Augen, Smiley bei Hover,
//  3D-Tilt nach Mausposition, rotierendem 4-Farben-Bälle-Kreuz hinter Glas.
//  Morph (geschlossen → offen) präzise nach Orby-Fremdcode (uiverse
//  serious-mule-50): content 12rem² → 260×160, bg-balls border-radius 48→20,
//  Augen-Opacity 1→0, Panel-Opacity 0→1; card 0.6s ease, Inhalt 0.3s ease.
//
//  `interaction`:
//   · "full"   — Home: volle Hot-Area (size*2), Open/Picker.
//   · "self"   — OrbLab-Vorschau: Hot-Area auf die Komponente begrenzt.
//   · "static" — Tiles: reines Standbild (kein Sensor, keine Buttons, kein Open).
// =============================================================================
/* eslint-disable react-refresh/only-export-components */

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { cn } from "@/lib/utils";
import type { Character, CharacterInteraction } from "./types";
import type { EntityState } from "../presets/orbPresets";
import { INPUT_MODES } from "../InputPills";
import type { InputMode } from "../InputPills";

const AUTO_CLOSE_MS = 5000;

type EyeMode = "normal" | "half" | "sad" | "closed" | "smile";

interface Tune {
  speedMul: number;
  eyeMode: EyeMode;
  ballFilter: string;
  pulseCard: boolean;
  glowBurst?: boolean;
}

const STATE_TUNE: Record<EntityState, Tune> = {
  idle: { speedMul: 1.0, eyeMode: "normal", ballFilter: "none", pulseCard: false },
  hover: { speedMul: 1.0, eyeMode: "smile", ballFilter: "none", pulseCard: false },
  processing: { speedMul: 0.4, eyeMode: "half", ballFilter: "brightness(1.1)", pulseCard: true },
  "review-ready": {
    speedMul: 0.7,
    eyeMode: "smile",
    ballFilter: "brightness(1.15)",
    pulseCard: false,
    glowBurst: true,
  },
  failed: {
    speedMul: 2.4,
    eyeMode: "sad",
    ballFilter: "saturate(0.4) brightness(0.7)",
    pulseCard: false,
  },
  "busy-blocked": {
    speedMul: 2.0,
    eyeMode: "closed",
    ballFilter: "saturate(0.5)",
    pulseCard: false,
  },
};

export const FacePillCharacter: Character = {
  id: "face-pill",
  label: "Face Pill",
  manifest: {
    id: "face-pill",
    label: "Face Pill",
    suppressCore: ["pointer-follow"],
    motion: ["tilt-3d", "eyes", "custom-morph"],
  },
  render: (props) => <FacePill {...props} />,
};

interface FacePillProps {
  state: EntityState;
  size: number;
  sample: { colors: { bg: string; c1: string; c2: string; c3: string } };
  onPickInputMode?: (mode: InputMode) => void;
  interaction?: CharacterInteraction;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const FacePill = ({
  state,
  size,
  sample,
  onPickInputMode,
  interaction = "full",
}: FacePillProps) => {
  const interactive = interaction !== "static";
  const [open, setOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  // Captured at pointerEnter (card flat, wrapper at rest) — stabile Tilt-Referenz.
  const restRect = useRef<DOMRect | null>(null);
  const tune = STATE_TUNE[state] ?? STATE_TUNE.idle;
  const { c1, c2, c3, bg } = sample.colors;

  // Skalierung (12rem = 192px Original).
  const k = size / 192;
  const closedSide = 192 * k;
  // Orby: content 12rem² → 260×160.
  const openW = 260 * k;
  const openH = 160 * k;
  const w = open ? openW : closedSide;
  const h = open ? openH : closedSide;
  const radius = 48 * k; // 3rem konstant (Orby content-card)
  const ballsRadius = (open ? 20 : 48) * k; // Orby: bg-balls 3rem → 20px

  const eyeW = 26 * k;
  const eyeH = 52 * k;
  const eyeGap = 32 * k;
  const smileySize = 60 * k;
  const ballSize = 96 * k; // 6rem
  const ballBlur = 30 * k;
  const glassBlur = 50 * k; // backdrop-filter blur(50px)
  const tz = 45 * k;

  const showSmile = tune.eyeMode === "smile" || hovering;

  // ---- Tilt -----------------------------------------------------------------
  const resetTilt = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transition = "transform 600ms ease";
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)`;
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    bumpAutoClose();
    if (open) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = restRect.current ?? card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    // Orby: rotateX/Y ±15°.
    const rx = clamp(-(y - 0.5) * 30, -15, 15);
    const ry = clamp((x - 0.5) * 30, -15, 15);
    card.style.transition = "transform 80ms linear";
    card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${tz}px)`;
  };

  // ---- Auto-Close -----------------------------------------------------------
  const clearAutoClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const bumpAutoClose = () => {
    if (!open) return;
    clearAutoClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), AUTO_CLOSE_MS);
  };

  // Outside-Click + Esc + initialer Auto-Close beim Öffnen.
  useEffect(() => {
    if (!open) {
      clearAutoClose();
      return;
    }
    resetTilt();
    closeTimer.current = window.setTimeout(() => setOpen(false), AUTO_CLOSE_MS);

    const onPointerDown = (e: globalThis.PointerEvent) => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      if (!wrap.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
      clearAutoClose();
    };
  }, [open]);

  // Bälle-Kreuz rotiert als Ganzes (Orby: rotate-background-balls 10s linear,
  // Hover pausiert). speedMul aus STATE_TUNE moduliert das Tempo.
  const ballsSpin = `face-pill-balls-rotate ${(10 / tune.speedMul).toFixed(2)}s linear infinite`;

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 grid place-items-center"
      style={{ width: size, height: size, perspective: `${1000 * k}px` }}
    >
      {/* Glow-Pad hinter der Card (Orby ::after grauer Pad) */}
      <div
        aria-hidden
        className="absolute rounded-[2.6rem] bg-card/40 blur-2xl pointer-events-none"
        style={{
          width: w * 0.95,
          height: h * 0.92,
          transition: "all 500ms ease",
        }}
      />

      {/* Card — klickbar im closed-State zum Öffnen */}
      <div
        ref={cardRef}
        onClick={(e) => {
          if (!interactive || open) return;
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          "relative select-none overflow-hidden",
          "border border-white/10 bg-background/30",
          "shadow-[0_10px_40px_-8px_rgba(0,0,60,0.45),inset_0_0_20px_rgba(255,255,255,0.06)]",
          tune.pulseCard && "animate-[face-pill-breathe_1.2s_ease-in-out_infinite]",
          tune.glowBurst && "animate-[face-pill-glow_800ms_ease-out]",
          interactive && !open ? "cursor-pointer" : "cursor-default",
        )}
        style={{
          width: w,
          height: h,
          borderRadius: radius,
          // Orby: card 0.6s ease.
          transition: "width 0.6s ease, height 0.6s ease, border-radius 0.6s ease",
          transformStyle: "preserve-3d",
          backdropFilter: `blur(${glassBlur}px)`,
          WebkitBackdropFilter: `blur(${glassBlur}px)`,
          willChange: "transform",
        }}
      >
        {/* Bälle-Layer — rotierendes 4-Farben-Kreuz (N/S/W/O) */}
        <div
          aria-hidden
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{
            borderRadius: ballsRadius,
            transition: "border-radius 0.3s ease",
          }}
        >
          <div
            className="face-pill-balls absolute left-1/2 top-1/2"
            style={{
              transform: "translate(-50%, -50%)",
              width: ballSize * 2,
              height: ballSize * 2,
              animation: ballsSpin,
              animationPlayState: hovering ? "paused" : "running",
              filter: tune.ballFilter !== "none" ? tune.ballFilter : undefined,
              willChange: "transform",
            }}
          >
            <Ball pos="top" size={ballSize} blur={ballBlur} color={c1 || "#9147ff"} />
            <Ball pos="bottom" size={ballSize} blur={ballBlur} color={c2 || "#34d399"} />
            <Ball pos="left" size={ballSize} blur={ballBlur} color={c3 || "#ec4899"} />
            <Ball pos="right" size={ballSize} blur={ballBlur} color={bg || "#05e0f5"} />
          </div>
        </div>

        {/* Augen / Smiley */}
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center pointer-events-none",
            "transition-opacity duration-300",
            open ? "opacity-0" : "opacity-100",
          )}
          style={{ gap: eyeGap }}
        >
          {showSmile ? (
            <>
              <Smiley size={smileySize} />
              <Smiley size={smileySize} />
            </>
          ) : (
            <>
              <Eye w={eyeW} h={eyeH} mode={tune.eyeMode} />
              <Eye w={eyeW} h={eyeH} mode={tune.eyeMode} />
            </>
          )}
        </div>

        {/* Open-State: 2×2 Input-Mode-Buttons (Inhalt — wandert in Phase 5 in den Composer) */}
        {interactive && (
          <div
            className={cn(
              "absolute inset-0 z-20 grid grid-cols-2 grid-rows-2 gap-2 p-3",
              "transition-opacity duration-300",
              open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {INPUT_MODES.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onPickInputMode?.(id);
                  setOpen(false);
                }}
                className={cn(
                  "flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-2xl",
                  "border border-white/15 bg-background/40 backdrop-blur-md",
                  "text-foreground/90 transition-colors",
                  "hover:border-primary/60 hover:bg-primary/20 hover:text-primary",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                )}
              >
                <Icon className="size-5" />
                <span className="text-xs tracking-wide">{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hot-Area: Pointer-Tracking. "full" = size*2 (großzügig, Home),
          "self" = nur über der Komponente (OrbLab). "static" = kein Sensor. */}
      {interactive && !open && (
        <div
          className="absolute pointer-events-none"
          style={
            interaction === "self"
              ? { width: size, height: size, left: 0, top: 0 }
              : { width: size * 2, height: size * 2, left: -size / 2, top: -size / 2 }
          }
        >
          <div
            className="absolute inset-0"
            style={{ pointerEvents: "auto", cursor: "pointer" }}
            onPointerEnter={() => {
              restRect.current = cardRef.current?.getBoundingClientRect() ?? null;
              setHovering(true);
            }}
            onPointerMove={handlePointerMove}
            onPointerLeave={() => {
              restRect.current = null;
              setHovering(false);
              resetTilt();
            }}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes face-pill-balls-rotate {
          from { transform: translate(-50%, -50%) rotate(360deg); }
          to   { transform: translate(-50%, -50%) rotate(0deg); }
        }
        @keyframes face-pill-blink {
          0%, 46%, 50%, 96%, 100% { transform: scaleY(1); }
          48%, 98% { transform: scaleY(0.18); }
        }
        @keyframes face-pill-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.97); }
        }
        @keyframes face-pill-glow {
          0% { box-shadow: 0 0 0 rgba(255,255,255,0); }
          50% { box-shadow: 0 0 60px rgba(255,255,255,0.4); }
          100% { box-shadow: 0 10px 40px -8px rgba(0,0,60,0.45); }
        }
        @media (prefers-reduced-motion: reduce) {
          .face-pill-balls { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

// ----- Einzelner Ball (fixe Himmelsrichtung im rotierenden Kreuz) -----
const Ball = ({
  pos,
  size,
  blur,
  color,
}: {
  pos: "top" | "bottom" | "left" | "right";
  size: number;
  blur: number;
  color: string;
}) => {
  const base: CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
    borderRadius: "50%",
    background: color,
    filter: `blur(${blur}px)`,
  };
  const place: Record<typeof pos, CSSProperties> = {
    top: { top: 0, left: "50%", transform: "translateX(-50%)" },
    bottom: { bottom: 0, left: "50%", transform: "translateX(-50%)" },
    left: { left: 0, top: "50%", transform: "translateY(-50%)" },
    right: { right: 0, top: "50%", transform: "translateY(-50%)" },
  };
  return <span aria-hidden style={{ ...base, ...place[pos] }} />;
};

// ----- Auge -----
const Eye = ({ w, h, mode }: { w: number; h: number; mode: EyeMode }) => {
  let scaleY = 1;
  let animate = true;
  if (mode === "half") {
    scaleY = 0.45;
    animate = false;
  } else if (mode === "sad") {
    scaleY = 0.25;
    animate = false;
  } else if (mode === "closed") {
    scaleY = 0.06;
    animate = false;
  }

  return (
    <span
      className="block bg-white"
      style={{
        width: w,
        height: h,
        borderRadius: 16, // Orby: radius 16px
        transform: `scaleY(${scaleY})`,
        transformOrigin: "center",
        animation: animate ? `face-pill-blink 10s linear infinite` : undefined,
        transition: "transform 300ms ease",
      }}
    />
  );
};

// ----- Smiley (Orby Happy-SVG) -----
const Smiley = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ color: "#fff" }}>
    <path
      fill="currentColor"
      d="M8.28386 16.2843C8.9917 15.7665 9.8765 14.731 12 14.731C14.1235 14.731 15.0083 15.7665 15.7161 16.2843C17.8397 17.8376 18.7542 16.4845 18.9014 15.7665C19.4323 13.1777 17.6627 11.1066 17.3088 10.5888C16.3844 9.23666 14.1235 8 12 8C9.87648 8 7.61556 9.23666 6.69122 10.5888C6.33728 11.1066 4.56771 13.1777 5.09858 15.7665C5.24582 16.4845 6.16034 17.8376 8.28386 16.2843Z"
    />
  </svg>
);
