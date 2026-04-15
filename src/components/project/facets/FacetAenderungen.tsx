import BentoCard from "../BentoCard";
import { ArrowUpDown } from "lucide-react";

interface Aenderung {
  id: string;
  text: string;
  delta: string;
  zeit: string;
  quelle: string;
}

const deltaColors: Record<string, string> = {
  add: "bg-emerald-500/15 text-emerald-400",
  replace: "bg-amber-500/15 text-amber-400",
  confirm: "bg-primary/15 text-primary",
  contradict: "bg-destructive/15 text-destructive",
  discard: "bg-muted text-muted-foreground",
};

const deltaLabels: Record<string, string> = {
  add: "Neu",
  replace: "Ersetzt",
  confirm: "Bestätigt",
  contradict: "Widerspruch",
  discard: "Verworfen",
};

const FacetAenderungen = ({ aenderungen }: { aenderungen: Aenderung[] }) => {
  return (
    <BentoCard title="Änderungen" icon={<ArrowUpDown className="w-4 h-4" />} badge={aenderungen.length} expandable defaultExpanded>
      <div className="space-y-3">
        {aenderungen.map((a) => (
          <div key={a.id} className="flex items-start gap-3 group">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium mt-0.5 shrink-0 ${deltaColors[a.delta] || deltaColors.add}`}>
              {deltaLabels[a.delta] || a.delta}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground/85 leading-snug">{a.text}</p>
              <p className="text-xs text-muted-foreground/50 mt-0.5">{a.zeit} · {a.quelle}</p>
            </div>
          </div>
        ))}
      </div>
    </BentoCard>
  );
};

export default FacetAenderungen;
