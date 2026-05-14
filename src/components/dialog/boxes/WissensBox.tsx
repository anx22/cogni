import { FileText } from "lucide-react";
import BoxFrame from "../BoxFrame";
import type { DialogBox } from "@/lib/dialog/types";

const WissensBox = ({ box }: { box: DialogBox }) => {
  const sachverhalt: string = box.payload?.sachverhalt ?? "";
  const details: Array<{ label: string; value: string }> = box.payload?.details ?? [];
  const quelle: string | undefined = box.payload?.quelle;

  return (
    <BoxFrame box={box}>
      {sachverhalt && (
        <p className="text-lg md:text-xl text-foreground/90 leading-relaxed font-light">
          {sachverhalt}
        </p>
      )}
      {details.length > 0 && (
        <dl className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-6 gap-y-2 pt-1">
          {details.map((d, i) => (
            <div key={i} className="contents">
              <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground/60 sm:pt-1">
                {d.label}
              </dt>
              <dd className="text-base text-foreground/85 font-light">{d.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {quelle && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground/60 tracking-wide pt-2">
          <FileText className="w-3.5 h-3.5" /> {quelle}
        </p>
      )}
    </BoxFrame>
  );
};

export default WissensBox;
