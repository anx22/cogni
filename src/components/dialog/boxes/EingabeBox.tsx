import { useState } from "react";
import { Check } from "lucide-react";
import { useDialog } from "../DialogProvider";
import BoxFrame, { ActionBtn } from "../BoxFrame";
import type { DialogBox } from "@/lib/dialog/types";

const EingabeBox = ({ box }: { box: DialogBox }) => {
  const { updateBoxState, updateBoxPayload } = useDialog();
  const [text, setText] = useState(box.payload?.text ?? "");

  return (
    <BoxFrame
      box={box}
      actions={
        <>
          <ActionBtn
            variant="primary"
            icon={<Check className="w-3 h-3" />}
            onClick={() => {
              updateBoxPayload(box.id, { text });
              if (text.trim()) updateBoxState(box.id, "bestaetigt");
            }}
          >
            Senden
          </ActionBtn>
          <ActionBtn onClick={() => updateBoxState(box.id, "verworfen")}>Verwerfen</ActionBtn>
        </>
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
