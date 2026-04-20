import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useDialog } from "../DialogProvider";
import BoxFrame, { ActionBtn } from "../BoxFrame";
import type { DialogBox } from "@/lib/dialog/types";

// V1-Hinweis: Wird kaum noch genutzt — Eingabe-/Auswahl-/Konfliktboxen schließen sich selbst ab.
// Nur dort einsetzen, wo ein expliziter, separater Bestätigungs-Schritt fachlich nötig ist.
const AktionsBox = ({ box }: { box: DialogBox }) => {
  const { updateBoxState, closeDialog } = useDialog();

  const commit = () => {
    updateBoxState(box.id, "bestaetigt");
    toast("Übernommen", { description: "Backend-Anbindung folgt in Phase 7." });
    setTimeout(closeDialog, 250);
  };

  return (
    <BoxFrame
      box={box}
      actions={
        <>
          <ActionBtn variant="primary" icon={<Check className="w-3 h-3" />} onClick={commit}>
            Übernehmen
          </ActionBtn>
          <ActionBtn icon={<X className="w-3 h-3" />} onClick={closeDialog}>
            Abbrechen
          </ActionBtn>
        </>
      }
    >
      <p className="text-sm text-foreground/90">Bereit zur Übernahme.</p>
    </BoxFrame>
  );
};

export default AktionsBox;
