import BentoCard from "../BentoCard";
import { Scale } from "lucide-react";

interface Entscheidung {
  id: string;
  title: string;
  status: string;
  entschiedenAm: string | null;
  quelle: string | null;
  angriffspunkt: string | null;
}

const statusStyle: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400",
  draft: "bg-amber-500/15 text-amber-400",
  superseded: "bg-muted text-muted-foreground",
  revoked: "bg-destructive/15 text-destructive",
};

const statusLabel: Record<string, string> = {
  active: "Aktiv",
  draft: "Entwurf",
  superseded: "Ersetzt",
  revoked: "Widerrufen",
};

const FacetEntscheidungen = ({ entscheidungen }: { entscheidungen: Entscheidung[] }) => {
  return (
    <BentoCard title="Entscheidungen" icon={<Scale className="w-4 h-4" />} badge={entscheidungen.length} expandable defaultExpanded>
      <div className="space-y-2.5">
        {entscheidungen.map((e) => (
          <div key={e.id} className="flex items-start gap-3 p-3 rounded-xl bg-background/40 border border-border/30 hover:border-border/60 transition-all">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium mt-0.5 shrink-0 ${statusStyle[e.status] || statusStyle.draft}`}>
              {statusLabel[e.status] || e.status}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground/85">{e.title}</p>
              <div className="flex flex-wrap gap-x-3 mt-1 text-xs text-muted-foreground/45">
                {e.entschiedenAm && <span>{e.entschiedenAm}</span>}
                {e.quelle && <span>{e.quelle}</span>}
                {e.angriffspunkt && <span className="text-amber-400/70">⚠ {e.angriffspunkt}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </BentoCard>
  );
};

export default FacetEntscheidungen;
