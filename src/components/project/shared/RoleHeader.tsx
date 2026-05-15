// =============================================================================
//  RoleHeader — konsistenter Section-Header für die vier Projekt-Rollen.
//  Eyebrow (uppercase) + H2. Optionaler Right-Slot für Counts/Filter.
//  Nur die Lage-Rolle bekommt einen anderen Stil (Hero, separat).
// =============================================================================
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Role = "lage" | "handlung" | "verlauf" | "substanz";

const EYEBROWS: Record<Role, string> = {
  lage: "Status",
  handlung: "Operatives Zentrum",
  verlauf: "Chronologie",
  substanz: "Inhalt",
};

interface Props {
  role: Role;
  title: string;
  right?: ReactNode;
  className?: string;
}

const RoleHeader = ({ role, title, right, className }: Props) => (
  <header
    className={cn("mb-6 flex items-end justify-between gap-4", className)}
    data-role={role}
  >
    <div>
      <p className="t-micro ink-4 mb-2">{EYEBROWS[role]}</p>
      <h2 className="text-2xl font-light tracking-tight text-foreground">{title}</h2>
    </div>
    {right && <div className="shrink-0 text-xs text-muted-foreground">{right}</div>}
  </header>
);

export default RoleHeader;
