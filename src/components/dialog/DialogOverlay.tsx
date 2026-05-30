import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useDialog } from "./DialogProvider";
import BatchReviewOverlay from "./BatchReviewOverlay";
import FaktDrillOverlay from "./FaktDrillOverlay";
import { END_STATES } from "@/lib/dialog/types";

const DialogOverlay = () => {
  const { session, closeDialog } = useDialog();

  const decisionBoxes = session?.boxes.filter((b) => b.type !== "kontext") ?? [];
  const open = decisionBoxes.filter((b) => !END_STATES.includes(b.state));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDialog();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeDialog]);

  if (!session) return null;

  const overlay =
    open.length === 1 ? (
      <FaktDrillOverlay onClose={closeDialog} />
    ) : (
      <BatchReviewOverlay onClose={closeDialog} />
    );

  return createPortal(overlay, document.body);
};

export default DialogOverlay;
