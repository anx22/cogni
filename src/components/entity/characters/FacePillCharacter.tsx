// =============================================================================
//  FacePillCharacter — Pill mit Augen + rotierende Blur-Bälle.
//  Im offenen Zustand erscheinen vier Input-Mode-Buttons (Notiz/Link/Datei/
//  Sprache) im Stil von InputPills. KEIN Textarea, kein Submit.
// =============================================================================

import { useState, type CSSProperties } from "react";
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

const STATE_TUNE: Record<
  string,
  { ballSpeed: number; eyeOpen: number; ballOpacity: number }
> = {
  idle: { ballSpeed: 14, eyeOpen: 1, ballOpacity: 0.85 },
  hover: { ballSpeed: 7, eyeOpen: 1, ballOpacity: 1 },
  processing: { ballSpeed: 3, eyeOpen: 0.15, ballOpacity: 1 },
  "review-ready": { ballSpeed: 9, eyeOpen: 1, ballOpacity: 1 },
  failed: { ballSpeed: 26, eyeOpen: 0.4, ballOpacity: 0.55 },
  "busy-blocked": { ballSpeed: 22, eyeOpen: 0.35, ballOpacity: 0.45 },
};

export const FacePillCharacter: Character = {
  id: "face-pill",
  label: "Face Pill",
  render: ({ state, size, sample, onClick, onPickInputMode }) => (
    <FacePill
      state={state}
      size={size}
      sample={sample}
      onClick={onClick}
      onPickInputMode={onPickInputMode}
    />
  ),
};

interface FacePillProps {
  state: string;
  size: number;
  sample: { colors: { bg: string; c1: string; c2: string; c3: string } };
  onClick?: () => void;
  onPickInputMode?: (mode: InputMode) => void;
}

const FacePill = ({ state, size, sample, onClick, onPickInputMode }: FacePillProps) => {
  const [open, setOpen] = useState(false);
  const tune = STATE_TUNE[state] ?? STATE_TUNE.idle;
  const { c1, c2, c3, bg } = sample.colors;

  // Pill-Maße relativ zur Orb-Größe
  const closedW = Math.round(size * 0.62);
  const closedH = Math.round(size * 0.42);
  const openW = Math.min(Math.round(size * 1.0), 360);
  const openH = Math.round(size * 0.55);

  const w = open ? openW : closedW;
  const h = open ? openH : closedH;
  const ballSize = Math.round(size * 0.35);
  const eyeW = Math.max(6, Math.round(size * 0.045));
  const eyeH = Math.max(14, Math.round(size * 0.115));
  const eyeGap = Math.round(size * 0.085);

  const handleClick = () => {
    setOpen((o) => !o);
    onClick?.();
  };

  const pillStyle: CSSProperties = {
    width: w,
    height: h,
    borderRadius: h / 2,
    background: `${bg}cc`,
  };

  return (
    <div
      className="absolute inset-0 grid place-items-center"
      style={{ width: size, height: size }}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label={open ? "Schließen" : "Öffnen"}
        className={cn(
          "relative overflow-hidden border border-white/10 backdrop-blur-xl",
          "transition-all duration-500 ease-out",
          "shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5),inset_0_0_10px_rgba(255,255,255,0.05)]",
          "hover:shadow-[0_14px_50px_-10px_rgba(0,0,0,0.6),inset_0_0_14px_rgba(255,255,255,0.08)]",
          "active:scale-[0.98]",
        )}
        style={pillStyle}
      >
        {/* Rotierende Blur-Bälle */}
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 -z-0 motion-reduce:animate-none"
          style={{
            width: ballSize * 2.4,
            height: ballSize * 2.4,
            transform: "translate(-50%, -50%)",
            animation: `face-pill-rotate ${tune.ballSpeed}s linear infinite`,
            opacity: tune.ballOpacity,
          }}
        >
          <span
            className="absolute rounded-full"
            style={{
              top: 0,
              left: "50%",
              width: ballSize,
              height: ballSize,
              transform: "translateX(-50%)",
              background: c1,
              filter: "blur(28px)",
            }}
          />
          <span
            className="absolute rounded-full"
            style={{
              bottom: 0,
              left: "50%",
              width: ballSize,
              height: ballSize,
              transform: "translateX(-50%)",
              background: c2,
              filter: "blur(28px)",
            }}
          />
          <span
            className="absolute rounded-full"
            style={{
              top: "50%",
              left: 0,
              width: ballSize,
              height: ballSize,
              transform: "translateY(-50%)",
              background: c3,
              filter: "blur(28px)",
            }}
          />
          <span
            className="absolute rounded-full"
            style={{
              top: "50%",
              right: 0,
              width: ballSize,
              height: ballSize,
              transform: "translateY(-50%)",
              background: c1,
              filter: "blur(28px)",
            }}
          />
        </span>

        {/* Augen oder Input-Modi */}
        <span
          aria-hidden
          className={cn(
            "relative z-10 flex items-center justify-center",
            "transition-opacity duration-300",
            open ? "opacity-0 pointer-events-none" : "opacity-100",
          )}
          style={{ gap: eyeGap, height: eyeH }}
        >
          <Eye w={eyeW} h={eyeH} openness={tune.eyeOpen} />
          <Eye w={eyeW} h={eyeH} openness={tune.eyeOpen} delay={0.4} />
        </span>

        <div
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center gap-2 px-3",
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
                "border-white/15 bg-background/30 text-foreground/85",
                "hover:border-primary/50 hover:bg-primary/15 hover:text-primary",
                "backdrop-blur-md",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </button>

      <style>{`
        @keyframes face-pill-rotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="face-pill-rotate"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

const Eye = ({
  w,
  h,
  openness,
  delay = 0,
}: {
  w: number;
  h: number;
  openness: number;
  delay?: number;
}) => (
  <span
    className="rounded-full bg-white motion-reduce:animate-none"
    style={{
      width: w,
      height: h * openness,
      transition: "height 300ms ease",
      animation: `face-pill-blink 6s ${delay}s infinite`,
      ["--eye-h" as string]: `${h * openness}px`,
    } as CSSProperties}
  >
    <style>{`
      @keyframes face-pill-blink {
        0%, 92%, 100% { height: var(--eye-h); }
        95% { height: 2px; }
      }
    `}</style>
  </span>
);
