import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CardVariant = "default" | "interactive" | "circular" | "flat";

/**
 * Standard-Card-Surface mit vier Varianten:
 *  - default:     surface-2, dezenter Glow
 *  - interactive: + Hover-Lift + Cursor (für klickbare Cards)
 *  - circular:    50% Radius (für runde Action-Buttons)
 *  - flat:        ohne Shadow (für nested Surfaces)
 */
const CardSurface = ({
  children,
  className,
  divideRows = false,
  overflowHidden = false,
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  divideRows?: boolean;
  overflowHidden?: boolean;
  variant?: CardVariant;
}) => {
  const base =
    variant === "circular"
      ? "rounded-full border border-c-hair-2 bg-c-surface-1 shadow-[var(--shadow-card-cogni)]"
      : "rounded-xl border border-border-subtle bg-surface-2";
  const shadow =
    variant === "flat" || variant === "circular" ? "" : "shadow-card-glow";
  const interactive =
    variant === "interactive"
      ? "cursor-pointer transition-all hover:bg-surface-3 hover:border-border-strong hover:-translate-y-0.5"
      : "";

  return (
    <div
      className={cn(
        base,
        shadow,
        interactive,
        divideRows && "divide-y divide-border-subtle",
        overflowHidden && "overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
};

export default CardSurface;
