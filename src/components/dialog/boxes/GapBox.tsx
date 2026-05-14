import { useState } from "react";
import { Check, Clock } from "lucide-react";
import { useDialog } from "../DialogProvider";
import BoxFrame, { ActionBtn } from "../BoxFrame";
import type { DialogBox } from "@/lib/dialog/types";

const GapBox = ({ box }: { box: DialogBox }) => {
  const { updateBoxPayload, commitBox, readonly } = useDialog();
  const [answer, setAnswer] = useState(box.payload?.antwort ?? "");

  const submit = () => {
    if (!answer.trim()) return;
    updateBoxPayload(box.id, { antwort: answer });
    commitBox(box.id, "confirm", { antwort: answer });
  };

  return (
    <BoxFrame
      box={box}
      actions={
        <>
          <ActionBtn variant="primary" icon={<Check className="w-4 h-4" />} onClick={submit}>
            Lücke schließen
          </ActionBtn>
          <ActionBtn
            icon={<Clock className="w-4 h-4" />}
            onClick={() => commitBox(box.id, "reject")}
          >
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
