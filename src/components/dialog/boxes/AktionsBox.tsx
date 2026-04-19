import { Check, GitMerge, X } from "lucide-react";
import { toast } from "sonner";
import { useDialog } from "../DialogProvider";
import BoxFrame, { ActionBtn } from "../BoxFrame";
import { END_STATES, type DialogBox } from "@/lib/dialog/types";

const AktionsBox = ({ box }: { box: DialogBox }) => {
  const { session, updateBoxState, closeDialog } = useDialog();

  const otherBoxes = (session?.boxes ?? []).filter((b) => b.type !== "aktion");
  const allDecided = otherBoxes.every((b) => END_STATES.includes(b.state));

  const commit = () => {
    updateBoxState(box.id, "bestaetigt");
    toast("Commit (Mock)", {
      description: "Backend-Anbindung folgt in Phase 7.",
    });
    setTimeout(closeDialog, 250);
  };

  return (
    <BoxFrame
      box={box}
      actions={
        <>
          <ActionBtn
            variant="primary"
            icon={<Check className="w-3 h-3" />}
            onClick={commit}
          >
            Commit
          </ActionBtn>
          <ActionBtn icon={<GitMerge className="w-3 h-3" />} onClick={commit}>
            Mergen
          </ActionBtn>
          <ActionBtn icon={<X className="w-3 h-3" />} onClick={closeDialog}>
            Abbrechen
          </ActionBtn>
        </>
      }
    >
      <p className="text-sm text-foreground/90">
        {allDecided
          ? "Alle Boxen entschieden — bereit zum Commit."
          : "Bitte zuerst alle Boxen oben entscheiden. Du kannst trotzdem committen."}
      </p>
    </BoxFrame>
  );
};

export default AktionsBox;
