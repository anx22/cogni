import { useState } from "react";
import { Check } from "lucide-react";
import { useDialog } from "../DialogProvider";
import BoxFrame, { ActionBtn } from "../BoxFrame";
import type { DialogBox } from "@/lib/dialog/types";
import { useManualOverrides } from "@/lib/dialog/manualOverrides";

const EingabeBox = ({ box }: { box: DialogBox }) => {
  const { session, updateBoxState, updateBoxPayload, closeDialog, readonly, gateReason } = useDialog();
  const { markManual } = useManualOverrides();
  const [text, setText] = useState(box.payload?.text ?? "");

  const blocked = !!gateReason;
  const canSubmit = !blocked && !readonly && text.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    updateBoxPayload(box.id, { text });
    updateBoxState(box.id, "bestaetigt");
    if (session?.context) markManual(session.context);
    setTimeout(closeDialog, 250);
  };

  return (
    <BoxFrame
      box={box}
      actions={
        <ActionBtn
          variant="primary"
          icon={<Check className="w-4 h-4" />}
          onClick={submit}
          disabled={!canSubmit}
        >
          Senden
        </ActionBtn>
      }
    >
      {box.payload?.hinweis && (
        <p className="text-base text-muted-foreground/80">{box.payload.hinweis}</p>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={box.payload?.placeholder ?? "Text eingeben…"}
        rows={4}
        readOnly={readonly}
        className="w-full text-lg font-light bg-transparent border-b border-border-strong px-1 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
      />
    </BoxFrame>
  );
};

export default EingabeBox;
