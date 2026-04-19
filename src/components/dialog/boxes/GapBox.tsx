import { useState } from "react";
import { Check, Clock } from "lucide-react";
import { useDialog } from "../DialogProvider";
import BoxFrame, { ActionBtn } from "../BoxFrame";
import type { DialogBox } from "@/lib/dialog/types";

const GapBox = ({ box }: { box: DialogBox }) => {
  const { updateBoxState, updateBoxPayload } = useDialog();
  const [answer, setAnswer] = useState(box.payload?.antwort ?? "");

  return (
    <BoxFrame
      box={box}
      actions={
        <>
          <ActionBtn
            variant="primary"
            icon={<Check className="w-3 h-3" />}
            onClick={() => {
              updateBoxPayload(box.id, { antwort: answer });
              updateBoxState(box.id, answer.trim() ? "bestaetigt" : "geaendert");
            }}
          >
            Lücke schließen
          </ActionBtn>
          <ActionBtn icon={<Clock className="w-3 h-3" />} onClick={() => updateBoxState(box.id, "verworfen")}>
            Später
          </ActionBtn>
        </>
      }
    >
      {box.payload?.wirkung && (
        <p className="text-xs text-amber-300/80">Wirkung: {box.payload.wirkung}</p>
      )}
      {box.payload?.lebensdauer && (
        <p className="text-[11px] text-muted-foreground/70">{box.payload.lebensdauer}</p>
      )}
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Information ergänzen…"
        rows={3}
        className="w-full text-sm bg-surface-3 border border-border-subtle rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50"
      />
    </BoxFrame>
  );
};

export default GapBox;
