import { cn } from "@/lib/utils";

/**
 * Cogni brand assets.
 *
 * The mark is the luminous faceted-diamond knowledge-graph node served from
 * `/favicon.svg` (single source of truth — same vector as the browser icon).
 * Use `CogniMark` for the symbol alone, or `Logo` for the full lockup with
 * the "COGNI" wordmark.
 */

interface MarkProps {
  /** Rendered square size in pixels. */
  size?: number;
  className?: string;
}

export function CogniMark({ size = 28, className }: MarkProps) {
  return (
    <img
      src="/favicon.svg"
      width={size}
      height={size}
      alt="Cogni"
      draggable={false}
      className={cn("block select-none", className)}
    />
  );
}

interface LogoProps {
  /** Height of the mark in pixels; the wordmark scales alongside it. */
  size?: number;
  /** Hide the "COGNI" wordmark and show only the mark. */
  markOnly?: boolean;
  className?: string;
}

export function Logo({ size = 28, markOnly = false, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <CogniMark size={size} />
      {!markOnly && (
        <span
          className="font-semibold uppercase leading-none text-foreground"
          style={{ fontSize: size * 0.62, letterSpacing: "0.22em" }}
        >
          Cogni
        </span>
      )}
    </span>
  );
}

export default Logo;
