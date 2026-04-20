import { useState } from "react";
import { Check } from "lucide-react";
import { useDialog } from "../DialogProvider";
import BoxFrame, { ActionBtn } from "../BoxFrame";
import type { DialogBox } from "@/lib/dialog/types";
import { useManualOverrides } from "@/lib/dialog/manualOverrides";

const EingabeBox = ({ box }: { box: DialogBox }) => {
  const { session, updateBoxState, updateBoxPayload, closeDialog } = useDialog();
  const { markManual } = useManualOverrides();
  const [text, setText] = useState(box.payload?.text ?? "");

  const submit = () => {
    if (!text.trim()) return;
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
          icon={<Check className="w-3 h-3" />}
          onClick={submit}
        >
          Senden
        </ActionBtn>
      }
    >
      {box.payload?.hinweis && (
        <p className="text-xs text-muted-foreground">{box.payload.hinweis}</p>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={box.payload?.placeholder ?? "Text eingeben…"}
        rows={4}
        className="w-full text-sm bg-surface-3 border border-border-subtle rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50"
      />
    </BoxFrame>
  );
};

export default EingabeBox;
