import BentoCard from "../BentoCard";
import { AlertTriangle } from "lucide-react";

interface Konflikt {
  id: string;
  typ: string;
  title: string;
  beschreibung: string;
  faktA: string;
  faktB: string;
  status: string;
}

const FacetKonflikte = ({ konflikte }: { konflikte: Konflikt[] }) => {
  return (
    <BentoCard title="Konflikte" icon={<AlertTriangle className="w-4 h-4" />} badge={konflikte.length} badgeVariant="warning" className="h-full">
      <div className="space-y-4">
        {konflikte.map((k) => (
          <div key={k.id} className="rounded-xl border border-destructive/15 bg-destructive/5 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-medium text-foreground/90">{k.title}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive shrink-0">{k.typ}</span>
            </div>
            <p className="text-xs text-muted-foreground/70">{k.beschreibung}</p>
            <div className="grid grid-cols-1 gap-2">
              <div className="text-xs p-2.5 rounded-lg bg-background/60 border border-border/40">
                <span className="text-muted-foreground/50">A:</span> <span className="text-foreground/70">{k.faktA}</span>
              </div>
              <div className="text-xs p-2.5 rounded-lg bg-background/60 border border-border/40">
                <span className="text-muted-foreground/50">B:</span> <span className="text-foreground/70">{k.faktB}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </BentoCard>
  );
};

export default FacetKonflikte;
