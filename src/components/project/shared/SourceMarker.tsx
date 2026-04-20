import { forwardRef } from "react";
import { FileText, UserCheck } from "lucide-react";
import { useDialog } from "@/components/dialog/DialogProvider";
import { buildSourceSession } from "@/lib/dialog/sessionFactories";

interface SourceMarkerProps {
  quelle: string;
  manuell?: boolean;
}

const SourceMarker = forwardRef<HTMLButtonElement, SourceMarkerProps>(({ quelle, manuell }, ref) => {
  const { openDialog } = useDialog();
  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openDialog(buildSourceSession(quelle));
      }}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] transition-colors max-w-[240px] ${
        manuell
          ? "bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary/90 hover:text-primary"
          : "bg-muted/40 hover:bg-muted/70 border-border/40 text-muted-foreground/80 hover:text-foreground/90"
      }`}
      title={manuell ? `Manueller Eingriff · Quelle: ${quelle}` : `Quelle: ${quelle}`}
    >
      {manuell ? (
        <UserCheck className="w-3 h-3 shrink-0" />
      ) : (
        <FileText className="w-3 h-3 shrink-0" />
      )}
      <span className="truncate">{quelle}</span>
      {manuell && <span className="text-[10px] opacity-70 shrink-0">manuell</span>}
    </button>
  );
});
SourceMarker.displayName = "SourceMarker";

export default SourceMarker;
