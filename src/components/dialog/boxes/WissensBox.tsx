import { FileText } from "lucide-react";
import BoxFrame from "../BoxFrame";
import type { DialogBox } from "@/lib/dialog/types";

const WissensBox = ({ box }: { box: DialogBox }) => (
  <BoxFrame box={box}>
    <p className="text-sm text-foreground/90 leading-relaxed">{box.payload?.sachverhalt}</p>
    {box.payload?.quelle && (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/40 border border-border/40 text-[11px] text-muted-foreground">
        <FileText className="w-3 h-3" /> {box.payload.quelle}
      </div>
    )}
  </BoxFrame>
);

export default WissensBox;
