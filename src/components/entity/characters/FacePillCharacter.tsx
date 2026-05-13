// =============================================================================
//  FacePillCharacter — 1:1 Port von Cobp/serious-mule-50.
//  Squircle-Card 12rem (skaliert), 4 rotierende Blur-Bälle, blinzelnde Augen,
//  Smiley bei Hover, 3D-Tilt nach Mausposition. Im offenen Zustand erscheinen
//  vier Input-Mode-Buttons. Bewusst KEIN prefers-reduced-motion-Bremsen.
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
  idle:           { ballSpeed: 10, eyeMode: "normal",  ballFilter: "none",                     pulseCard: false },
  hover:          { ballSpeed: 10, eyeMode: "smile",   ballFilter: "none",                     pulseCard: false, ballsPaused: true },
  processing:     { ballSpeed: 4,  eyeMode: "half",    ballFilter: "none",                     pulseCard: true },
  "review-ready": { ballSpeed: 8,  eyeMode: "smile",   ballFilter: "brightness(1.15)",         pulseCard: false, glowBurst: true },
  failed:         { ballSpeed: 26, eyeMode: "sad",     ballFilter: "saturate(0.4) brightness(0.7)", pulseCard: false },
  "busy-blocked": { ballSpeed: 22, eyeMode: "closed",  ballFilter: "saturate(0.5)",            pulseCard: false },
} as const;

type Tune = (typeof STATE_TUNE)[keyof typeof STATE_TUNE] & { ballsPaused?: boolean; glowBurst?: boolean };

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
  const { c1, c2, c3 } = sample.colors;

  // Skalierung gegenüber Original (12rem = 192px)
  const k = size / 192;
  const closedSide = 192 * k;
  const openW = 260 * k;
  const openH = 160 * k;
  const w = open ? openW : closedSide;
  const h = open ? openH : closedSide;
  const radius = (open ? 32 : 48) * k;

  const eyeW = 26 * k;
  const eyeH = 52 * k;
  const eyeGap = 32 * k; // 2rem
  const smileySize = 60 * k;
  const ballSize = 96 * k; // 6rem
  const ballBlur = 30 * k;
  const tz = 45 * k;

  const showSmile = tune.eyeMode === "smile" || hovering;
  const ballsPaused = hovering || tune.ballsPaused;

  // 3D Pointer Tilt
  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rx = clamp(-(y - 0.5) * 30, -15, 15);
    const ry = clamp((x - 0.5) * 30, -15, 15);
    card.style.transition = "transform 80ms linear";
    card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${tz}px)`;
  };

  const resetTilt = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transition = "transform 600ms ease";
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)`;
  };

  const cardStyle: CSSProperties = {
    width: w,
    height: h,
    borderRadius: radius,
    transformStyle: "preserve-3d",
    willChange: "transform",
  };

  return (
    <div
      className="absolute inset-0 grid place-items-center"
      style={{ width: size, height: size, perspective: `${1000 * k}px` }}
    >
      {/* :after-Pad aus der Quelle: subtiler Backdrop hinter der Card */}
      <div
        aria-hidden
        className="absolute rounded-[2.6rem] bg-card/40 blur-2xl"
        style={{
          width: w * 0.95,
          height: h * 0.92,
          transition: "all 500ms ease",
        }}
      />

      <div
        ref={cardRef}
        className={cn(
          "relative cursor-pointer select-none overflow-hidden",
          "border border-white/10 bg-background/30 backdrop-blur-xl",
          "shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6),inset_0_0_20px_rgba(255,255,255,0.05)]",
          tune.pulseCard && "animate-[face-pill-breathe_1.2s_ease-in-out_infinite]",
          tune.glowBurst && "animate-[face-pill-glow_800ms_ease-out]",
        )}
        style={cardStyle}
        onPointerMove={handlePointerMove}
        onPointerEnter={() => setHovering(true)}
        onPointerLeave={() => {
          setHovering(false);
          resetTilt();
        }}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        {/* Bälle-Layer */}
        <div
          aria-hidden
          className="absolute inset-0 overflow-hidden"
          style={{ borderRadius: radius }}
        >
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: ballSize * 2.2,
              height: ballSize * 2.2,
              marginLeft: -(ballSize * 1.1),
              marginTop: -(ballSize * 1.1),
              animation: `face-pill-rotate ${tune.ballSpeed}s linear infinite reverse`,
              animationPlayState: ballsPaused ? "paused" : "running",
              filter: tune.ballFilter,
            }}
          >
            <Ball top={0} left="50%" tx="-50%" ty="0" size={ballSize} blur={ballBlur} color="#ec4899" />
            <Ball bottom={0} left="50%" tx="-50%" ty="0" size={ballSize} blur={ballBlur} color={c1 || "#9147ff"} />
            <Ball top="50%" left={0} tx="0" ty="-50%" size={ballSize} blur={ballBlur} color={c2 || "#34d399"} />
            <Ball top="50%" right={0} tx="0" ty="-50%" size={ballSize} blur={ballBlur} color={c3 || "#05e0f5"} />
          </div>
          {/* Milchglas */}
          <div className="absolute inset-0 bg-white/10" />
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
              <Eye w={eyeW} h={eyeH} mode={tune.eyeMode} delay={0} />
              <Eye w={eyeW} h={eyeH} mode={tune.eyeMode} delay={0} />
            </>
          )}
        </div>

        {/* Open-State: Input-Mode-Buttons */}
        <div
          className={cn(
            "absolute inset-0 z-20 flex flex-wrap items-center justify-center gap-2 p-4",
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

      <style>{`
        @keyframes face-pill-rotate {
          from { transform: rotate(360deg); }
          to   { transform: rotate(0deg); }
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

// ----- Bälle -----
interface BallProps {
  size: number;
  blur: number;
  color: string;
  top?: number | string;
  bottom?: number | string;
  left?: number | string;
  right?: number | string;
  tx: string;
  ty: string;
}
const Ball = ({ size, blur, color, top, bottom, left, right, tx, ty }: BallProps) => (
  <span
    className="absolute rounded-full"
    style={{
      top, bottom, left, right,
      width: size,
      height: size,
      transform: `translate(${tx}, ${ty})`,
      background: color,
      filter: `blur(${blur}px)`,
    }}
  />
);

// ----- Auge -----
const Eye = ({
  w,
  h,
  mode,
  delay,
}: {
  w: number;
  h: number;
  mode: "normal" | "half" | "sad" | "closed" | "smile";
  delay: number;
}) => {
  // mode → finale Höhe & Animation
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
        animation: animate ? `face-pill-blink 10s ${delay}s infinite linear` : undefined,
        transition: "transform 300ms ease",
      }}
    />
  );
};

// ----- Smiley (1:1 SVG aus Quelle) -----
const Smiley = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ color: "#fff" }}
  >
    <path
      fill="currentColor"
      d="M8.28386 16.2843C8.9917 15.7665 9.8765 14.731 12 14.731C14.1235 14.731 15.0083 15.7665 15.7161 16.2843C17.8397 17.8376 18.7542 16.4845 18.9014 15.7665C19.4323 13.1777 17.6627 11.1066 17.3088 10.5888C16.3844 9.23666 14.1235 8 12 8C9.87648 8 7.61556 9.23666 6.69122 10.5888C6.33728 11.1066 4.56771 13.1777 5.09858 15.7665C5.24582 16.4845 6.16034 17.8376 8.28386 16.2843Z"
    />
  </svg>
);

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
