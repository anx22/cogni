import { Check, X, Pencil, Circle } from "lucide-react";
import type { BoxState } from "@/lib/dialog/types";

// V1: nur klar lesbare Zustände sichtbar machen.
// vorgeschlagen / aufgeklappt / eskaliert wirken intern und werden nicht prominent gelabelt.
const meta: Record<BoxState, { label: string; cls: string; icon: React.ReactNode } | null> = {
  vorgeschlagen: null,
  aufgeklappt: null,
  geaendert: {
    label: "Geändert",
    cls: "text-amber-300 border-amber-400/40 bg-amber-400/10",
    icon: <Pencil className="w-3 h-3" />,
  },
  bestaetigt: {
    label: "Übernommen",
    cls: "text-emerald-300 border-emerald-400/40 bg-emerald-400/10",
    icon: <Check className="w-3 h-3" />,
  },
  verworfen: {
    label: "Verworfen",
    cls: "text-muted-foreground/60 border-border-subtle bg-surface-2",
    icon: <X className="w-3 h-3" />,
  },
  eskaliert: {
    label: "Offen",
    cls: "text-muted-foreground/60 border-border-subtle bg-surface-2",
    icon: <Circle className="w-3 h-3" />,
  },
};

const BoxStateBadge = ({ state }: { state: BoxState }) => {
  const m = meta[state];
  if (!m) return null;
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
