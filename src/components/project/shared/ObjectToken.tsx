import {
  Calendar,
  GitBranch,
  AlertTriangle,
  FileText,
  Layers,
  HelpCircle,
  Ban,
  CheckSquare,
  Circle,
  MessageSquare,
} from "lucide-react";
import type { ObjektTyp } from "@/data/demoProject";

const map: Record<ObjektTyp, { icon: React.ElementType; label: string; color: string }> = {
  termin: { icon: Calendar, label: "Termin", color: "text-blue-300/80" },
  entscheidung: { icon: GitBranch, label: "Entscheidung", color: "text-violet-300/80" },
  konflikt: { icon: AlertTriangle, label: "Konflikt", color: "text-destructive/90" },
  dokument: { icon: FileText, label: "Dokument", color: "text-muted-foreground/70" },
  thema: { icon: Layers, label: "Thema", color: "text-cyan-300/80" },
  gap: { icon: HelpCircle, label: "Gap", color: "text-amber-300/80" },
  blocker: { icon: Ban, label: "Blocker", color: "text-destructive/90" },
  aufgabe: { icon: CheckSquare, label: "Aufgabe", color: "text-emerald-300/80" },
  offener_punkt: { icon: Circle, label: "Offener Punkt", color: "text-foreground/60" },
  feedback: { icon: MessageSquare, label: "Feedback", color: "text-pink-300/80" },
};

const ObjectToken = ({ typ, showLabel = false }: { typ: ObjektTyp; showLabel?: boolean }) => {
  const { icon: Icon, label, color } = map[typ];
  return (
    <span className={`inline-flex items-center gap-1 ${color}`} title={label}>
      <Icon className="w-3.5 h-3.5" />
      {showLabel && <span className="text-[11px] uppercase tracking-wider">{label}</span>}
    </span>
  );
};

export default ObjectToken;
