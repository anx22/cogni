import { FileText } from "lucide-react";
import { toast } from "sonner";

const SourceMarker = ({ quelle }: { quelle: string }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      toast(`Quelle: ${quelle}`, {
        description: "Quellenansicht öffnet sich in Phase 4 (Dialog-Overlay).",
      });
    }}
    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/40 hover:bg-muted/70 border border-border/40 text-[11px] text-muted-foreground/80 hover:text-foreground/90 transition-colors max-w-[220px]"
    title={`Quelle: ${quelle}`}
  >
    <FileText className="w-3 h-3 shrink-0" />
    <span className="truncate">{quelle}</span>
  </button>
);

export default SourceMarker;
