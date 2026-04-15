import BentoCard from "../BentoCard";
import { Clock } from "lucide-react";

interface TimelineEntry {
  id: string;
  datum: string;
  text: string;
  typ: string;
}

const typDot: Record<string, string> = {
  change: "bg-amber-400",
  confirm: "bg-primary",
  add: "bg-emerald-400",
  conflict: "bg-destructive",
};

const FacetTimeline = ({ timeline }: { timeline: TimelineEntry[] }) => {
  return (
    <BentoCard title="Timeline" icon={<Clock className="w-4 h-4" />} expandable defaultExpanded>
      <div className="relative pl-4 space-y-4">
        {/* Vertical line */}
        <div className="absolute left-[5px] top-1 bottom-1 w-px bg-border/40" />

        {timeline.map((t) => (
          <div key={t.id} className="flex items-start gap-3 relative">
            <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${typDot[t.typ] || typDot.add}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground/80 leading-snug">{t.text}</p>
              <p className="text-xs text-muted-foreground/40 mt-0.5">{t.datum}</p>
            </div>
          </div>
        ))}
      </div>
    </BentoCard>
  );
};

export default FacetTimeline;
