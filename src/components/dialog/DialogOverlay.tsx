import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useDialog } from "./DialogProvider";
import BoxRenderer from "./BoxRenderer";
import { END_STATES } from "@/lib/dialog/types";
import { toast } from "sonner";

const DialogOverlay = () => {
  const { session, closeDialog } = useDialog();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") tryClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (!session) return null;

  const decided = session.boxes.filter((b) => END_STATES.includes(b.state)).length;
  const total = session.boxes.length;

  const tryClose = () => {
    if (decided < total) {
      toast("Schließen ohne Antwort?", {
        description: "Erneut schließen bestätigt.",
        action: { label: "Schließen", onClick: () => closeDialog() },
      });
      return;
    }
    closeDialog();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-background/85 backdrop-blur-md animate-[fade-in_0.2s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) tryClose();
      }}
    >
      <div className="w-full max-w-2xl my-12 mx-4 rounded-2xl border border-border-strong bg-surface-1 shadow-card-glow overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border-subtle bg-surface-2/60">
          <div className="flex items-center gap-3 min-w-0">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70 truncate">
              {session.anlass}
            </p>
            {session.context && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                {session.context}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={tryClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
            aria-label="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {session.boxes.map((b, i) => (
            <div
              key={b.id}
              style={{ animationDelay: `${i * 60}ms` }}
              className="animate-[fade-in_0.25s_ease-out_both]"
            >
              <BoxRenderer box={b} />
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default DialogOverlay;
