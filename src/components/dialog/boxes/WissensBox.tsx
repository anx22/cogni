import { FileText } from "lucide-react";
import BoxFrame from "../BoxFrame";
import type { DialogBox } from "@/lib/dialog/types";

const WissensBox = ({ box }: { box: DialogBox }) => (
  <BoxFrame box={box}>
    <p className="text-lg md:text-xl text-foreground/90 leading-relaxed font-light">
      {box.payload?.sachverhalt}
    </p>
    {box.payload?.quelle && (
      <p className="flex items-center gap-2 text-sm text-muted-foreground/60 tracking-wide pt-2">
        <FileText className="w-3.5 h-3.5" /> {box.payload.quelle}
      </p>
    )}
  </BoxFrame>
);

export default WissensBox;
