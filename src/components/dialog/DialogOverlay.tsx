import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDialog } from "./DialogProvider";
import BoxRenderer from "./BoxRenderer";
import { END_STATES } from "@/lib/dialog/types";
import { fmtDateTimeLong } from "@/lib/format/dateFormatters";

const DialogOverlay = () => {
  const { session, closeDialog, readonly } = useDialog();
  const navigate = useNavigate();

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
  const decided = decisionBoxes.filter((b) => END_STATES.includes(b.state)).length;
  const total = decisionBoxes.length;
  const closedAt = fmtDateTimeLong(session.closedAt);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-background/80 backdrop-blur-xl animate-[fade-in_0.25s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeDialog();
      }}
    >
      {/* Schwebender Header — kein Card-Look */}
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 px-5 sm:px-10 md:px-16 lg:px-24 pt-5 sm:pt-10 pb-4 sm:pb-6 backdrop-blur-md bg-background/40">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground/60 mb-1.5 sm:mb-2">
            {readonly ? "Abgeschlossen" : session.context ?? "Verstehen"}
            {readonly && closedAt && (
              <span className="ml-3 normal-case tracking-normal text-muted-foreground/50">
                · {closedAt}
              </span>
            )}
          </p>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-light text-foreground/95 tracking-tight leading-tight line-clamp-2">
            {session.anlass}
          </h2>
          {session.projectId && session.projectName && (
            <button
              type="button"
              onClick={() => {
                closeDialog();
                navigate(`/projekt/${session.projectId}`);
              }}
              className="mt-2 sm:mt-3 inline-flex items-center gap-2 text-sm text-primary/80 hover:text-primary transition-colors tracking-wide"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span className="truncate max-w-[40ch]">{session.projectName}</span>
            </button>
          )}
          {!readonly && total > 0 && (
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground/70 tracking-wide">
              {decided} von {total} entschieden
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={closeDialog}
          className="mt-1 p-2 rounded-full text-muted-foreground/50 hover:text-foreground hover:bg-surface-2/50 transition-colors"
          aria-label="Schließen"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body — viel Luft, plakative Boxen */}
      <div className="px-5 sm:px-10 md:px-16 lg:px-24 pb-32 max-w-4xl mx-auto space-y-8 sm:space-y-10">
        {session.boxes.map((b, i) => (
          <div
            key={b.id}
            id={`dialog-box-${b.id}`}
            data-box-type={b.type}
            style={{ animationDelay: `${i * 80}ms` }}
            className="animate-[fade-in_0.35s_ease-out_both] scroll-mt-32"
          >
            <BoxRenderer box={b} />
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
};

export default DialogOverlay;
