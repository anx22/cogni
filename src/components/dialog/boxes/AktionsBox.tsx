import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useDialog } from "../DialogProvider";
import BoxFrame, { ActionBtn } from "../BoxFrame";
import type { DialogBox } from "@/lib/dialog/types";

const AktionsBox = ({ box }: { box: DialogBox }) => {
  const { updateBoxState, closeDialog } = useDialog();

  const commit = () => {
    updateBoxState(box.id, "bestaetigt");
    toast("Übernommen");
    setTimeout(closeDialog, 250);
  };

  return (
    <BoxFrame
      box={box}
      actions={
        <>
          <ActionBtn variant="primary" icon={<Check className="w-4 h-4" />} onClick={commit}>
            Übernehmen
          </ActionBtn>
          <ActionBtn icon={<X className="w-4 h-4" />} onClick={closeDialog}>
            Abbrechen
          </ActionBtn>
        </>
      }
    >
      <p className="text-lg text-foreground/90 font-light">Bereit zur Übernahme.</p>
    </BoxFrame>
  );
};

export default AktionsBox;
