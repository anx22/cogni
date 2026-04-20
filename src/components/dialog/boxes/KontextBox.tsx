import { ExternalLink } from "lucide-react";
import BoxFrame, { ActionBtn } from "../BoxFrame";
import type { DialogBox } from "@/lib/dialog/types";

const KontextBox = ({ box }: { box: DialogBox }) => {
  return (
    <BoxFrame
      box={box}
      actions={
        <ActionBtn icon={<ExternalLink className="w-4 h-4" />}>Quelle öffnen</ActionBtn>
      }
    >
      {box.payload?.auszug && (
        <blockquote className="text-lg text-foreground/85 leading-relaxed border-l-2 border-border-strong pl-5 italic font-light">
          {box.payload.auszug}
        </blockquote>
      )}
      {box.payload?.begruendung && (
        <p className="text-base text-muted-foreground/80">{box.payload.begruendung}</p>
      )}
      {box.payload?.quelle && (
        <p className="text-sm text-muted-foreground/60 tracking-wide">{box.payload.quelle}</p>
      )}
    </BoxFrame>
  );
};

export default KontextBox;
