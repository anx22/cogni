import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Wiederkehrendes "uppercase tracking" Section-Label, das in Project-Components
 * als Überschrift / Eyebrow benutzt wird (z. B. "Operatives Zentrum").
 */
const SectionLabel = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <p
    className={cn(
      "text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70",
      className,
    )}
  >
    {children}
  </p>
);

export default SectionLabel;
