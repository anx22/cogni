import { useState } from "react";
import { Check } from "lucide-react";
import { useDialog } from "../DialogProvider";
import BoxFrame, { ActionBtn } from "../BoxFrame";
import type { DialogBox } from "@/lib/dialog/types";
import { useManualOverrides } from "@/lib/dialog/manualOverrides";

const AuswahlBox = ({ box }: { box: DialogBox }) => {
  const { session, updateBoxState, updateBoxPayload, readonly } = useDialog();
  const { markManual } = useManualOverrides();
  const opts: string[] = box.payload?.optionen ?? [];
  const [sel, setSel] = useState<string>(box.payload?.auswahl ?? "");

  return (
    <BoxFrame
      box={box}
      actions={
        <ActionBtn
          variant="primary"
          icon={<Check className="w-4 h-4" />}
          onClick={() => {
            updateBoxPayload(box.id, { auswahl: sel });
            if (sel) {
              updateBoxState(box.id, "bestaetigt");
              if (session?.context) markManual(session.context);
            }
          }}
        >
          Übernehmen
        </ActionBtn>
      }
    >
      <div className="space-y-2">
        {opts.map((o) => {
          const active = sel === o;
          return (
            <label
              key={o}
              className={`flex items-center gap-4 px-5 py-4 rounded-lg cursor-pointer transition-colors ${
                active
                  ? "bg-primary/10 border border-primary/40"
                  : "bg-surface-2/40 border border-transparent hover:border-border-subtle"
              } ${readonly ? "pointer-events-none" : ""}`}
            >
              <input
                type="radio"
                checked={active}
                onChange={() => setSel(o)}
                disabled={readonly}
                className="accent-primary w-4 h-4"
              />
              <span className="text-lg text-foreground/95 font-light">{o}</span>
            </label>
          );
        })}
      </div>
    </BoxFrame>
  );
};

export default AuswahlBox;
