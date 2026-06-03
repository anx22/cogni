// =============================================================================
//  EntitySurface — Abstract digital "ground plane" of dots that sits BEHIND
//  the orb. Square element, self-centered, with a circular mask whose inner
//  hole is auto-aligned to the orb radius (so dots never overlap the orb).
//
//  surface.innerHole is interpreted as EXTRA CLEARANCE in % of surface radius
//  beyond the orb edge (0 = ring starts exactly at orb edge).
//  surface.outerFade is interpreted as EXTRA REACH in % of surface radius
//  beyond the orb edge before the ring fades out.
// =============================================================================

import type { CSSProperties, FC } from "react";
import { cn } from "@/lib/utils";
import type { SampledSurface } from "../presets/orbPresets";

interface EntitySurfaceProps {
  /** Orb diameter in px (the surface is sized as orbSize * surface.scale). */
  orbSize: number;
  surface: SampledSurface;
  className?: string;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const EntitySurface: FC<EntitySurfaceProps> = ({ orbSize, surface, className }) => {
  const scale = Math.max(1.05, surface.scale);
  const size = Math.round(orbSize * scale);
  const tile = Math.max(surface.dotSize * surface.dotSpacing, surface.dotSize + 1);
  const animate = surface.rotationDuration > 0;

  // Mask radii expressed in % of surface radius (since we use `closest-side`).
  // Orb radius / surface radius = 1 / scale.
  const orbPct = (1 / scale) * 100;
  const innerStart = clamp(orbPct + Math.max(0, surface.innerHole), 0, 95);
  const innerSoft = clamp(innerStart + 4, 0, 98);
  const outerEnd = clamp(
    orbPct + Math.max(surface.innerHole + 8, surface.outerFade),
    innerSoft + 4,
    100,
  );
  const outerSoft = clamp(outerEnd - 8, innerSoft + 2, outerEnd - 1);

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
          "--m-in-a": `${innerStart}%`,
          "--m-in-b": `${innerSoft}%`,
          "--m-out-a": `${outerSoft}%`,
          "--m-out-b": `${outerEnd}%`,
          "--rot-dur": `${surface.rotationDuration}s`,
          animation: animate ? `entity-surface-spin var(--rot-dur) linear infinite` : "none",
        } as CSSProperties
      }
    >
      <style>{`
        .entity-surface {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          flex: none;
          border-radius: 50%;
          background-image: radial-gradient(
            circle,
            var(--dot-color) calc(var(--dot-size) / 2),
            transparent calc(var(--dot-size) / 2 + 0.5px)
          );
          background-size: var(--tile) var(--tile);
          background-position: center;
          -webkit-mask-image: radial-gradient(
            circle closest-side,
            transparent 0%,
            transparent var(--m-in-a),
            black var(--m-in-b),
            black var(--m-out-a),
            transparent var(--m-out-b)
          );
          mask-image: radial-gradient(
            circle closest-side,
            transparent 0%,
            transparent var(--m-in-a),
            black var(--m-in-b),
            black var(--m-out-a),
            transparent var(--m-out-b)
          );
        }
        .entity-surface { will-change: transform; }
        @keyframes entity-surface-spin { to { transform: translate(-50%, -50%) rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .entity-surface { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default EntitySurface;
