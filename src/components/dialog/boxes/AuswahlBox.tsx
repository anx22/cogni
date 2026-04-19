import { useState } from "react";
import { Check } from "lucide-react";
import { useDialog } from "../DialogProvider";
import BoxFrame, { ActionBtn } from "../BoxFrame";
import type { DialogBox } from "@/lib/dialog/types";

const AuswahlBox = ({ box }: { box: DialogBox }) => {
  const { updateBoxState, updateBoxPayload } = useDialog();
  const opts: string[] = box.payload?.optionen ?? [];
  const [sel, setSel] = useState<string>(box.payload?.auswahl ?? "");

  return (
    <BoxFrame
      box={box}
      actions={
        <ActionBtn
          variant="primary"
          icon={<Check className="w-3 h-3" />}
          onClick={() => {
            updateBoxPayload(box.id, { auswahl: sel });
            if (sel) updateBoxState(box.id, "bestaetigt");
          }}
        >
          Übernehmen
        </ActionBtn>
      }
    >
      <div className="space-y-1.5">
        {opts.map((o) => (
          <label
            key={o}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-surface-3 border border-border-subtle cursor-pointer hover:border-border-strong"
          >
            <input type="radio" checked={sel === o} onChange={() => setSel(o)} className="accent-primary" />
            <span className="text-sm text-foreground/90">{o}</span>
          </label>
        ))}
      </div>
    </BoxFrame>
  );
};

export default AuswahlBox;
