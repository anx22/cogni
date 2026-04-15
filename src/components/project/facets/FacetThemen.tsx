import BentoCard from "../BentoCard";
import { Hash } from "lucide-react";

interface Thema {
  id: string;
  name: string;
  beschreibung: string;
  entscheidungen: number;
  offenePunkte: number;
  dokumente: number;
}

const FacetThemen = ({ themen }: { themen: Thema[] }) => {
  return (
    <BentoCard title="Themen" icon={<Hash className="w-4 h-4" />} badge={themen.length} expandable defaultExpanded>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {themen.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-border/40 bg-background/40 p-4 hover:border-primary/20 hover:bg-primary/5 transition-all duration-200 cursor-pointer group"
          >
            <h3 className="text-sm font-medium text-foreground/90 group-hover:text-primary/90 transition-colors">{t.name}</h3>
            <p className="text-xs text-muted-foreground/50 mt-1 line-clamp-1">{t.beschreibung}</p>
            <div className="flex gap-3 mt-3 text-[10px] text-muted-foreground/40">
              {t.entscheidungen > 0 && <span>{t.entscheidungen} Entsch.</span>}
              {t.offenePunkte > 0 && <span>{t.offenePunkte} Offen</span>}
              {t.dokumente > 0 && <span>{t.dokumente} Dok.</span>}
            </div>
          </div>
        ))}
      </div>
    </BentoCard>
  );
};

export default FacetThemen;
