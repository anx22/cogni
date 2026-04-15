import BentoCard from "../BentoCard";
import { CircleDot } from "lucide-react";

interface OffenerPunkt {
  id: string;
  title: string;
  status: string;
  projekt: string;
}

interface Aufgabe {
  id: string;
  title: string;
  status: string;
  zugewiesen: string | null;
  faellig: string | null;
}

const FacetOffenePunkte = ({ offenePunkte, aufgaben }: { offenePunkte: OffenerPunkt[]; aufgaben: Aufgabe[] }) => {
  return (
    <BentoCard title="Offene Punkte & Aufgaben" icon={<CircleDot className="w-4 h-4" />} badge={offenePunkte.length + aufgaben.length} expandable defaultExpanded>
      {/* Offene Punkte */}
      <div className="space-y-2 mb-4">
        <span className="text-xs text-muted-foreground/50 uppercase tracking-wider">Offene Punkte</span>
        {offenePunkte.map((op) => (
          <div key={op.id} className="flex items-center gap-2.5 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400/70 shrink-0" />
            <span className="text-foreground/80 flex-1">{op.title}</span>
            <span className="text-xs text-muted-foreground/35">{op.projekt}</span>
          </div>
        ))}
      </div>

      {/* Aufgaben */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground/50 uppercase tracking-wider">Aufgaben</span>
        {aufgaben.map((a) => (
          <div key={a.id} className="flex items-center gap-2.5 text-sm">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.status === "in_progress" ? "bg-primary" : "bg-muted-foreground/30"}`} />
            <span className="text-foreground/80 flex-1">{a.title}</span>
            <span className="text-xs text-muted-foreground/35">
              {a.zugewiesen || "—"}
              {a.faellig && ` · ${a.faellig}`}
            </span>
          </div>
        ))}
      </div>
    </BentoCard>
  );
};

export default FacetOffenePunkte;
