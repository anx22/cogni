import BentoCard from "../BentoCard";
import { MessageSquare } from "lucide-react";

interface FeedbackItem {
  id: string;
  inhalt: string;
  ziel: string;
  autor: string;
  datum: string;
}

interface Korrektur {
  id: string;
  text: string;
  vorher: string;
  nachher: string;
  datum: string;
}

const FacetFeedback = ({ feedback, korrekturen }: { feedback: FeedbackItem[]; korrekturen: Korrektur[] }) => {
  return (
    <BentoCard title="Feedback & Korrekturen" icon={<MessageSquare className="w-4 h-4" />} badge={feedback.length + korrekturen.length} expandable defaultExpanded>
      {/* Feedback */}
      <div className="space-y-3 mb-4">
        {feedback.map((f) => (
          <div key={f.id} className="text-sm space-y-1">
            <p className="text-foreground/75 leading-snug">"{f.inhalt}"</p>
            <p className="text-xs text-muted-foreground/40">
              {f.autor} · {f.datum} · zu: {f.ziel}
            </p>
          </div>
        ))}
      </div>

      {/* Korrekturen */}
      {korrekturen.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground/50 uppercase tracking-wider">Korrekturen</span>
          {korrekturen.map((k) => (
            <div key={k.id} className="text-sm p-2.5 rounded-lg bg-background/50 border border-border/30">
              <p className="text-foreground/75">{k.text}</p>
              <div className="flex gap-2 mt-1 text-xs">
                <span className="text-destructive/50 line-through">{k.vorher}</span>
                <span className="text-muted-foreground/30">→</span>
                <span className="text-emerald-400/70">{k.nachher}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </BentoCard>
  );
};

export default FacetFeedback;
