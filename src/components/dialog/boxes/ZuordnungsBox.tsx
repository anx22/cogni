import { useState } from "react";
import { useDialog } from "../DialogProvider";
import BoxFrame, { ActionBtn } from "../BoxFrame";
import { Check } from "lucide-react";
import type { DialogBox } from "@/lib/dialog/types";

const ZuordnungsBox = ({ box }: { box: DialogBox }) => {
  const { updateBoxState, updateBoxPayload } = useDialog();
  const options: string[] = box.payload?.optionen ?? [];
  const [sel, setSel] = useState<string>(box.payload?.auswahl ?? options[0] ?? "");

  return (
    <BoxFrame
      box={box}
      actions={
        <>
          <ActionBtn
            variant="primary"
            icon={<Check className="w-3 h-3" />}
            onClick={() => {
              updateBoxPayload(box.id, { auswahl: sel });
              updateBoxState(box.id, "bestaetigt");
            }}
          >
            Zuordnen
          </ActionBtn>
          <ActionBtn onClick={() => updateBoxState(box.id, "verworfen")}>Nicht zuordnen</ActionBtn>
        </>
      }
    >
      <p className="text-sm text-foreground/90">{box.payload?.frage}</p>
      <div className="space-y-1.5">
        {options.map((o) => (
          <label
            key={o}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-surface-3 border border-border-subtle cursor-pointer hover:border-border-strong"
          >
            <input
              type="radio"
              checked={sel === o}
              onChange={() => setSel(o)}
              className="accent-primary"
            />
            <span className="text-sm text-foreground/90">{o}</span>
          </label>
        ))}
      </div>
    </BoxFrame>
  );
};

export default ZuordnungsBox;
