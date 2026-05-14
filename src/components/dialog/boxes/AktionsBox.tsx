import { Check, X } from "lucide-react";
import { useDialog } from "../DialogProvider";
import BoxFrame, { ActionBtn } from "../BoxFrame";
import type { DialogBox } from "@/lib/dialog/types";

const AktionsBox = ({ box }: { box: DialogBox }) => {
  const { commitBox } = useDialog();

  return (
    <BoxFrame
      box={box}
      actions={
        <>
          <ActionBtn
            variant="primary"
            icon={<Check className="w-4 h-4" />}
            onClick={() => commitBox(box.id, "confirm")}
          >
            Übernehmen
          </ActionBtn>
          <ActionBtn icon={<X className="w-4 h-4" />} onClick={() => commitBox(box.id, "reject")}>
            Verwerfen
          </ActionBtn>
        </>
      }
    >
      <p className="text-lg text-foreground/90 font-light">Bereit zur Übernahme.</p>
    </BoxFrame>
  );
};

export default AktionsBox;
