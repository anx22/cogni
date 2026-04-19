import { Check, X, AlertTriangle, Pencil, Circle, Eye } from "lucide-react";
import type { BoxState } from "@/lib/dialog/types";

const meta: Record<BoxState, { label: string; cls: string; icon: React.ReactNode }> = {
  vorgeschlagen: {
    label: "Vorgeschlagen",
    cls: "text-muted-foreground/70 border-border-subtle bg-surface-2",
    icon: <Circle className="w-3 h-3" />,
  },
  aufgeklappt: {
    label: "Aufgeklappt",
    cls: "text-primary border-primary/40 bg-primary/10",
    icon: <Eye className="w-3 h-3" />,
  },
  geaendert: {
    label: "Geändert",
    cls: "text-amber-300 border-amber-400/40 bg-amber-400/10",
    icon: <Pencil className="w-3 h-3" />,
  },
  bestaetigt: {
    label: "Bestätigt",
    cls: "text-emerald-300 border-emerald-400/40 bg-emerald-400/10",
    icon: <Check className="w-3 h-3" />,
  },
  verworfen: {
    label: "Verworfen",
    cls: "text-muted-foreground/60 border-border-subtle bg-surface-2 line-through",
    icon: <X className="w-3 h-3" />,
  },
  eskaliert: {
    label: "Eskaliert",
    cls: "text-destructive border-destructive/50 bg-destructive/10",
    icon: <AlertTriangle className="w-3 h-3" />,
  },
};

const BoxStateBadge = ({ state }: { state: BoxState }) => {
  const m = meta[state];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wider ${m.cls}`}
    >
      {m.icon}
      {m.label}
    </span>
  );
};

export default BoxStateBadge;
