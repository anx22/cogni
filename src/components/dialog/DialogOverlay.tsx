import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDialog } from "./DialogProvider";
import BatchReviewOverlay from "./BatchReviewOverlay";
import FaktDrillOverlay from "./FaktDrillOverlay";
import ConfirmDestructive from "@/components/shared/ConfirmDestructive";
import { END_STATES } from "@/lib/dialog/types";

const DialogOverlay = () => {
  const { session, closeDialog } = useDialog();
  const [confirmClose, setConfirmClose] = useState(false);
  const escArmedAt = useRef<number | null>(null);

  const decisionBoxes = session?.boxes.filter((b) => b.type !== "kontext") ?? [];
  const open = decisionBoxes.filter((b) => !END_STATES.includes(b.state));
  const openCount = open.length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (openCount === 0) {
        closeDialog();
        return;
      }
      // Doppel-Esc innerhalb 2.5s → Confirm-Dialog
      const now = Date.now();
      if (escArmedAt.current && now - escArmedAt.current < 2500) {
        escArmedAt.current = null;
        setConfirmClose(true);
      } else {
        escArmedAt.current = now;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openCount, closeDialog]);

  if (!session) return null;

  const overlay =
    open.length === 1 ? (
      <FaktDrillOverlay onClose={() => (openCount > 0 ? setConfirmClose(true) : closeDialog())} />
    ) : (
      <BatchReviewOverlay onClose={() => (openCount > 0 ? setConfirmClose(true) : closeDialog())} />
    );

  return createPortal(
    <>
      {overlay}
      <ConfirmDestructive
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title={`Schließen mit ${openCount} offenen Punkten?`}
        description="Offene Punkte bleiben erhalten und können später bearbeitet werden. Bestätigte Entscheidungen sind bereits gespeichert."
        confirmLabel="Schließen"
        cancelLabel="Weiter prüfen"
        onConfirm={() => {
          setConfirmClose(false);
          closeDialog();
        }}
      />
    </>,
    document.body,
  );
};

export default DialogOverlay;
