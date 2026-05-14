import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Standard-Card-Surface der Project-Komponenten:
 * `rounded-xl border border-border-subtle bg-surface-2 shadow-card-glow`.
 * Optional `divide-y` für Listen-Inhalte und `overflow-hidden`.
 */
const CardSurface = ({
  children,
  className,
  divideRows = false,
  overflowHidden = false,
}: {
  children: ReactNode;
  className?: string;
  divideRows?: boolean;
  overflowHidden?: boolean;
}) => (
  <div
    className={cn(
      "rounded-xl border border-border-subtle bg-surface-2 shadow-card-glow",
      divideRows && "divide-y divide-border-subtle",
      overflowHidden && "overflow-hidden",
      className,
    )}
  >
    {children}
  </div>
);

export default CardSurface;
