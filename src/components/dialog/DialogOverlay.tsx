import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useDialog } from "./DialogProvider";
import BatchReviewOverlay from "./BatchReviewOverlay";
import FaktDrillOverlay from "./FaktDrillOverlay";
import { END_STATES } from "@/lib/dialog/types";

const DialogOverlay = () => {
  const { session, closeDialog } = useDialog();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDialog();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (!session) return null;

  const decisionBoxes = session.boxes.filter((b) => b.type !== "kontext");
  const open = decisionBoxes.filter((b) => !END_STATES.includes(b.state));

  if (open.length === 1) {
    return createPortal(<FaktDrillOverlay onClose={closeDialog} />, document.body);
  }
  return createPortal(<BatchReviewOverlay onClose={closeDialog} />, document.body);
};

export default DialogOverlay;
