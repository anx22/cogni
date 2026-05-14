import { useState } from "react";
import { Check, Clock } from "lucide-react";
import BoxFrame, { ActionBtn } from "../BoxFrame";
import type { DialogBox } from "@/lib/dialog/types";
import { useBoxSubmit } from "@/lib/dialog/useBoxSubmit";
import { useDialog } from "../DialogProvider";

const GapBox = ({ box }: { box: DialogBox }) => {
  const { readonly } = useDialog();
  // GapBox: keine Manual-Override-Markierung (Lücke schließen ≠ manuelle Korrektur).
  const { submit, reject } = useBoxSubmit(box, { markManualOnSubmit: false });
  const [answer, setAnswer] = useState(box.payload?.antwort ?? "");

  const onSubmit = () => {
    if (!answer.trim()) return;
    submit({ antwort: answer });
  };

  return (
    <BoxFrame
      box={box}
      actions={
        <>
          <ActionBtn variant="primary" icon={<Check className="w-4 h-4" />} onClick={onSubmit}>
            Lücke schließen
          </ActionBtn>
          <ActionBtn icon={<Clock className="w-4 h-4" />} onClick={reject}>
            Später
          </ActionBtn>
        </>
      }
    >
      {box.payload?.wirkung && (
        <p className="text-lg text-amber-300/80 font-light leading-relaxed">
          {box.payload.wirkung}
        </p>
      )}
      {box.payload?.betrifft && (
        <p className="text-base text-muted-foreground/70">Betrifft: {box.payload.betrifft}</p>
      )}
      {box.payload?.lebensdauer && (
        <p className="text-base text-muted-foreground/70">{box.payload.lebensdauer}</p>
      )}
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Information ergänzen…"
        rows={3}
        readOnly={readonly}
        className="w-full text-lg font-light bg-transparent border-b border-border-strong px-1 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
      />
    </BoxFrame>
  );
};

export default GapBox;
