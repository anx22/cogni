import BentoCard from "../BentoCard";
import { Users } from "lucide-react";

interface Stakeholder {
  id: string;
  name: string;
  rolle: string;
  org: string;
}

const FacetStakeholder = ({ stakeholder }: { stakeholder: Stakeholder[] }) => {
  return (
    <BentoCard title="Stakeholder" icon={<Users className="w-4 h-4" />} badge={stakeholder.length} expandable defaultExpanded>
      <div className="space-y-2.5">
        {stakeholder.map((s) => (
          <div key={s.id} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-primary/80">
                {s.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground/80">{s.name}</p>
              <p className="text-xs text-muted-foreground/40">{s.rolle} · {s.org}</p>
            </div>
          </div>
        ))}
      </div>
    </BentoCard>
  );
};

export default FacetStakeholder;
