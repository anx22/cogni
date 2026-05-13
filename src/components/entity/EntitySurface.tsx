// =============================================================================
//  EntitySurface — Abstract digital "ground plane" of dots that sits BEHIND
//  the orb. A larger ring of halftone dots, faded inside (so the orb sits
//  inside a hole) and outside, with optional very-slow rotation.
// =============================================================================

import type { CSSProperties, FC } from "react";
import { cn } from "@/lib/utils";
import type { SampledSurface } from "./orbPresets";

interface EntitySurfaceProps {
  /** Orb diameter in px (the surface is sized as orbSize * surface.scale). */
  orbSize: number;
  surface: SampledSurface;
  className?: string;
}

const EntitySurface: FC<EntitySurfaceProps> = ({ orbSize, surface, className }) => {
  const size = Math.round(orbSize * surface.scale);
  const tile = Math.max(surface.dotSize * surface.dotSpacing, surface.dotSize + 1);
  const animate = surface.rotationDuration > 0;

  return (
    <div
      className={cn("entity-surface pointer-events-none", className)}
      style={
        {
          width: `${size}px`,
          height: `${size}px`,
          opacity: surface.opacity,
          mixBlendMode: surface.blendMode,
          "--dot-color": surface.dotColor,
          "--dot-size": `${surface.dotSize}px`,
          "--tile": `${tile}px`,
          "--inner": `${surface.innerHole}%`,
          "--outer": `${surface.outerFade}%`,
          "--rot-dur": `${surface.rotationDuration}s`,
          animation: animate ? `entity-surface-spin var(--rot-dur) linear infinite` : "none",
        } as CSSProperties
      }
    >
      <style>{`
        .entity-surface {
          border-radius: 50%;
          background-image: radial-gradient(
            circle,
            var(--dot-color) calc(var(--dot-size) / 2),
            transparent calc(var(--dot-size) / 2 + 0.5px)
          );
          background-size: var(--tile) var(--tile);
          background-position: center;
          -webkit-mask-image: radial-gradient(
            circle,
            transparent 0%,
            transparent var(--inner),
            black calc(var(--inner) + 6%),
            black calc(var(--outer) - 8%),
            transparent var(--outer)
          );
          mask-image: radial-gradient(
            circle,
            transparent 0%,
            transparent var(--inner),
            black calc(var(--inner) + 6%),
            black calc(var(--outer) - 8%),
            transparent var(--outer)
          );
        }
        @keyframes entity-surface-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .entity-surface { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default EntitySurface;
