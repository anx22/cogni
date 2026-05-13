// =============================================================================
//  FacePillCharacter — Squircle-Pill mit blinzelnden Augen, Smiley bei Hover,
//  3D-Tilt nach Mausposition (Hit-Area = 2× Pill-Größe), 4 organisch
//  schwebende Blur-Bälle (Lissajous-Trajektorien). Im offenen Zustand
//  4 Input-Mode-Buttons. Bewusst KEIN reduced-motion-Bremsen.
// =============================================================================

import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { FileText, Link as LinkIcon, Paperclip, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Character } from "./types";
import type { InputMode } from "../InputPills";

const MODES: { id: InputMode; label: string; Icon: typeof FileText }[] = [
  { id: "note", label: "Notiz", Icon: FileText },
  { id: "link", label: "Link", Icon: LinkIcon },
  { id: "file", label: "Datei", Icon: Paperclip },
  { id: "voice", label: "Sprache", Icon: Mic },
];

// State → Variation. idle/hover bleiben Original-Look.
const STATE_TUNE = {
  idle:           { speedMul: 1.0, eyeMode: "normal",  ballFilter: "none",                            pulseCard: false },
  hover:          { speedMul: 1.0, eyeMode: "smile",   ballFilter: "none",                            pulseCard: false },
  processing:     { speedMul: 0.4, eyeMode: "half",    ballFilter: "brightness(1.1)",                 pulseCard: true },
  "review-ready": { speedMul: 0.7, eyeMode: "smile",   ballFilter: "brightness(1.15)",                pulseCard: false, glowBurst: true },
  failed:         { speedMul: 2.4, eyeMode: "sad",     ballFilter: "saturate(0.4) brightness(0.7)",   pulseCard: false },
  "busy-blocked": { speedMul: 2.0, eyeMode: "closed",  ballFilter: "saturate(0.5)",                   pulseCard: false },
} as const;

type Tune = (typeof STATE_TUNE)[keyof typeof STATE_TUNE] & { glowBurst?: boolean };

export const FacePillCharacter: Character = {
  id: "face-pill",
  label: "Face Pill",
  render: (props) => <FacePill {...props} />,
};

interface FacePillProps {
  state: string;
  size: number;
  sample: { colors: { bg: string; c1: string; c2: string; c3: string } };
  onClick?: () => void;
  onPickInputMode?: (mode: InputMode) => void;
}

const FacePill = ({ state, size, sample, onPickInputMode }: FacePillProps) => {
  const [open, setOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const tune = (STATE_TUNE[state as keyof typeof STATE_TUNE] ?? STATE_TUNE.idle) as Tune;
  const { c1, c2, c3, bg } = sample.colors;

  // Skalierung (12rem = 192px Original)
  const k = size / 192;
  const closedSide = 192 * k;
  const openW = 260 * k;
  const openH = 160 * k;
  const w = open ? openW : closedSide;
  const h = open ? openH : closedSide;
  const radius = (open ? 32 : 48) * k;

  const eyeW = 26 * k;
  const eyeH = 52 * k;
  const eyeGap = 32 * k;
  const smileySize = 60 * k;
  const ballSize = 110 * k;
  const ballBlur = 32 * k;
  const tz = 45 * k;

  const showSmile = tune.eyeMode === "smile" || hovering;

  // 3D Pointer Tilt — bezogen auf die Card-Bounds, Events vom großen Hit-Layer
  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rx = clamp(-(y - 0.5) * 30, -22, 22);
    const ry = clamp((x - 0.5) * 30, -22, 22);
    card.style.transition = "transform 80ms linear";
    card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${tz}px)`;
  };

  const resetTilt = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transition = "transform 600ms ease";
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)`;
  };

  const speedVar = { ["--orbit-speed" as string]: tune.speedMul } as CSSProperties;

  return (
    <div
      className="absolute inset-0 grid place-items-center"
      style={{ width: size, height: size, perspective: `${1000 * k}px` }}
    >
      {/* :after-Pad: subtiler Glow hinter der Card */}
      <div
        aria-hidden
        className="absolute rounded-[2.6rem] bg-card/40 blur-2xl pointer-events-none"
        style={{
          width: w * 0.95,
          height: h * 0.92,
          transition: "all 500ms ease",
        }}
      />

      {/* Card (visuell, nicht für Pointer-Tracking zuständig) */}
      <div
        ref={cardRef}
        className={cn(
          "relative select-none overflow-hidden pointer-events-none",
          "border border-white/10 bg-background/30 backdrop-blur-xl",
          "shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6),inset_0_0_20px_rgba(255,255,255,0.05)]",
          tune.pulseCard && "animate-[face-pill-breathe_1.2s_ease-in-out_infinite]",
          tune.glowBurst && "animate-[face-pill-glow_800ms_ease-out]",
        )}
        style={{
          width: w,
          height: h,
          borderRadius: radius,
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        {/* Bälle-Layer */}
        <div
          aria-hidden
          className="absolute inset-0 overflow-hidden"
          style={{ borderRadius: radius, ...speedVar }}
        >
          <Orbit name="a" size={ballSize} blur={ballBlur} color={c1 || "#ec4899"} duration={18} delay={0}    paused={hovering} filter={tune.ballFilter} />
          <Orbit name="b" size={ballSize} blur={ballBlur} color={c2 || "#9147ff"} duration={22} delay={-7}   paused={hovering} filter={tune.ballFilter} />
          <Orbit name="c" size={ballSize} blur={ballBlur} color={c3 || "#34d399"} duration={16} delay={-3}   paused={hovering} filter={tune.ballFilter} />
          <Orbit name="d" size={ballSize} blur={ballBlur} color={bg || "#05e0f5"} duration={20} delay={-11}  paused={hovering} filter={tune.ballFilter} />
          {/* Milchglas-Schicht über den Bällen */}
          <div className="absolute inset-0 bg-white/5" />
        </div>

        {/* Augen / Smiley */}
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center",
            "transition-opacity duration-300",
            open ? "opacity-0 pointer-events-none" : "opacity-100",
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

        {/* Open-State: Input-Mode-Buttons */}
        <div
          className={cn(
            "absolute inset-0 z-20 flex flex-wrap items-center justify-center gap-2 p-4 pointer-events-auto",
            "transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {MODES.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                onPickInputMode?.(id);
                setOpen(false);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5",
                "text-[11px] tracking-wide transition-colors",
                "border-white/20 bg-background/40 text-foreground/90",
                "hover:border-primary/60 hover:bg-primary/20 hover:text-primary",
                "backdrop-blur-md",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Hit-Layer: 2× Größe für großzügige Pointer-Hot-Area */}
      <div
        className="absolute"
        style={{
          width: size * 2,
          height: size * 2,
          left: -size / 2,
          top: -size / 2,
          cursor: "pointer",
        }}
        onPointerEnter={() => setHovering(true)}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          setHovering(false);
          resetTilt();
        }}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      />

      <style>{`
        @keyframes face-pill-orbit-a {
          0%   { transform: translate(-32%, -48%) scale(1); }
          25%  { transform: translate(22%, -42%)  scale(1.08); }
          50%  { transform: translate(38%, 12%)   scale(0.94); }
          75%  { transform: translate(-12%, 30%)  scale(1.05); }
          100% { transform: translate(-32%, -48%) scale(1); }
        }
        @keyframes face-pill-orbit-b {
          0%   { transform: translate(28%, 30%)   scale(1.02); }
          20%  { transform: translate(-20%, 20%)  scale(0.96); }
          45%  { transform: translate(-36%, -28%) scale(1.1); }
          70%  { transform: translate(10%, -36%)  scale(0.98); }
          100% { transform: translate(28%, 30%)   scale(1.02); }
        }
        @keyframes face-pill-orbit-c {
          0%   { transform: translate(-40%, 8%)   scale(0.98); }
          30%  { transform: translate(8%, 32%)    scale(1.06); }
          55%  { transform: translate(34%, -10%)  scale(0.92); }
          80%  { transform: translate(-4%, -32%)  scale(1.04); }
          100% { transform: translate(-40%, 8%)   scale(0.98); }
        }
        @keyframes face-pill-orbit-d {
          0%   { transform: translate(18%, -34%)  scale(1.04); }
          25%  { transform: translate(36%, 6%)    scale(0.95); }
          50%  { transform: translate(0%, 36%)    scale(1.08); }
          75%  { transform: translate(-34%, 4%)   scale(1.0); }
          100% { transform: translate(18%, -34%)  scale(1.04); }
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
          100% { box-shadow: 0 20px 60px -15px rgba(0,0,0,0.6); }
        }
      `}</style>
    </div>
  );
};

// ----- Einzelner organisch schwebender Ball -----
const Orbit = ({
  name,
  size,
  blur,
  color,
  duration,
  delay,
  paused,
  filter,
}: {
  name: "a" | "b" | "c" | "d";
  size: number;
  blur: number;
  color: string;
  duration: number;
  delay: number;
  paused: boolean;
  filter: string;
}) => (
  <span
    className="absolute left-1/2 top-1/2 rounded-full"
    style={{
      width: size,
      height: size,
      marginLeft: -size / 2,
      marginTop: -size / 2,
      background: color,
      filter: `blur(${blur}px) ${filter !== "none" ? filter : ""}`.trim(),
      animation: `face-pill-orbit-${name} calc(${duration}s * var(--orbit-speed, 1)) ease-in-out infinite`,
      animationDelay: `${delay}s`,
      animationPlayState: paused ? "paused" : "running",
      willChange: "transform",
    }}
  />
);

// ----- Auge -----
const Eye = ({
  w,
  h,
  mode,
}: {
  w: number;
  h: number;
  mode: "normal" | "half" | "sad" | "closed" | "smile";
}) => {
  let scaleY = 1;
  let animate = true;
  if (mode === "half") { scaleY = 0.45; animate = false; }
  else if (mode === "sad") { scaleY = 0.25; animate = false; }
  else if (mode === "closed") { scaleY = 0.06; animate = false; }

  return (
    <span
      className="block bg-white"
      style={{
        width: w,
        height: h,
        borderRadius: Math.min(w, h) * 0.45,
        transform: `scaleY(${scaleY})`,
        transformOrigin: "center",
        animation: animate ? `face-pill-blink 10s linear infinite` : undefined,
        transition: "transform 300ms ease",
      }}
    />
  );
};

// ----- Smiley (1:1 SVG aus Quelle) -----
const Smiley = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ color: "#fff" }}>
    <path
      fill="currentColor"
      d="M8.28386 16.2843C8.9917 15.7665 9.8765 14.731 12 14.731C14.1235 14.731 15.0083 15.7665 15.7161 16.2843C17.8397 17.8376 18.7542 16.4845 18.9014 15.7665C19.4323 13.1777 17.6627 11.1066 17.3088 10.5888C16.3844 9.23666 14.1235 8 12 8C9.87648 8 7.61556 9.23666 6.69122 10.5888C6.33728 11.1066 4.56771 13.1777 5.09858 15.7665C5.24582 16.4845 6.16034 17.8376 8.28386 16.2843Z"
    />
  </svg>
);

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
