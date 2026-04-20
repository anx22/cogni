import { ExternalLink, FileText } from "lucide-react";
import BoxFrame, { ActionBtn } from "../BoxFrame";
import type { DialogBox } from "@/lib/dialog/types";

const KontextBox = ({ box }: { box: DialogBox }) => {
  return (
    <BoxFrame
      box={box}
      actions={
        <ActionBtn icon={<ExternalLink className="w-3 h-3" />}>Quelle öffnen</ActionBtn>
      }
    >
      {box.payload?.auszug && (
        <blockquote className="text-sm text-foreground/85 leading-relaxed border-l-2 border-border-strong pl-3 italic">
          {box.payload.auszug}
        </blockquote>
      )}
      {box.payload?.begruendung && (
        <p className="text-xs text-muted-foreground">{box.payload.begruendung}</p>
      )}
      {box.payload?.quelle && (
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/40 border border-border/40 text-[11px] text-muted-foreground">
          <FileText className="w-3 h-3" /> {box.payload.quelle}
        </div>
      )}
    </BoxFrame>
  );
};

export default KontextBox;
