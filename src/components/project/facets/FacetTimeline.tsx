import BentoCard from "../BentoCard";
import { Clock } from "lucide-react";

interface TimelineEntry {
  id: string;
  datum: string;
  text: string;
  typ: string;
  quelle?: string;
}

const typDot: Record<string, string> = {
  change: "bg-amber-400",
  confirm: "bg-primary",
  add: "bg-emerald-400",
  conflict: "bg-destructive",
};

const deltaLabels: Record<string, { label: string; color: string }> = {
  change: { label: "Ersetzt", color: "bg-amber-500/15 text-amber-400" },
  confirm: { label: "Bestätigt", color: "bg-primary/15 text-primary" },
  add: { label: "Neu", color: "bg-emerald-500/15 text-emerald-400" },
  conflict: { label: "Widerspruch", color: "bg-destructive/15 text-destructive" },
};

const FacetTimeline = ({ timeline }: { timeline: TimelineEntry[] }) => {
  return (
    <BentoCard title="Timeline" icon={<Clock className="w-4 h-4" />} badge={timeline.length} expandable defaultExpanded>
      <div className="relative pl-4 space-y-4">
        {/* Vertical line */}
        <div className="absolute left-[5px] top-1 bottom-1 w-px bg-border/40" />

        {timeline.map((t) => {
          const delta = deltaLabels[t.typ];
          return (
            <div key={t.id} className="flex items-start gap-3 relative">
              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${typDot[t.typ] || typDot.add}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {delta && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${delta.color}`}>
                      {delta.label}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground/50">{t.datum}</span>
                </div>
                <p className="text-sm text-foreground/90 leading-snug">{t.text}</p>
                {t.quelle && (
                  <p className="text-xs text-muted-foreground/45 mt-0.5">{t.quelle}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </BentoCard>
  );
};

export default FacetTimeline;
