import { ReactNode, forwardRef } from "react";
import { Check, Lock } from "lucide-react";
import { useDialog } from "./DialogProvider";
import type { DialogBox } from "@/lib/dialog/types";

interface BoxFrameProps {
  box: DialogBox;
  children: ReactNode;
  /** When true, hide the default action footer (box renders its own). */
  hideActions?: boolean;
  /** Custom action set. */
  actions?: ReactNode;
  /** Wenn true, ignoriert die Box das globale gateReason (z. B. die Zuordnungsbox selbst). */
  ignoreGate?: boolean;
}

const BoxFrame = ({ box, children, hideActions, actions, ignoreGate }: BoxFrameProps) => {
  const { commitBox, readonly, gateReason } = useDialog();
  const verworfen = box.state === "verworfen";
  const bestaetigt = box.state === "bestaetigt";
  const geaendert = box.state === "geaendert";
  const collapsed = false;

  const gated = !ignoreGate && !!gateReason && !bestaetigt && !verworfen;

  const opacity = verworfen
    ? "opacity-50"
    : bestaetigt
      ? "opacity-70"
      : gated
        ? "opacity-60"
        : "opacity-100";

  return (
    <section
      className={`relative transition-opacity ${opacity}`}
      aria-disabled={gated || undefined}
    >
      <div className="flex items-baseline gap-3 mb-5">
        {geaendert && (
          <span
            className="w-2 h-2 rounded-full bg-amber-400/80 mt-2"
            aria-label="geändert"
          />
        )}
        {bestaetigt && (
          <Check className="w-5 h-5 text-emerald-400/80 mt-1" aria-label="übernommen" />
        )}
        <h3
          className={`text-2xl md:text-3xl font-light text-foreground/95 leading-snug tracking-tight ${
            verworfen ? "line-through" : ""
          }`}
        >
          {box.title}
        </h3>
      </div>

      {!collapsed && (
        <div
          className={`space-y-5 text-foreground/85 ${gated ? "pointer-events-none select-none" : ""}`}
          aria-disabled={gated || undefined}
        >
          {children}
        </div>
      )}

      {gated && (
        <div className="mt-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
          <Lock className="w-3.5 h-3.5" />
          <span>{gateReason}</span>
        </div>
      )}

      {!hideActions && !collapsed && !readonly && !gated && (
        <div className="flex flex-wrap items-center gap-6 mt-8">
          {actions ?? (
            <>
              <ActionBtn variant="primary" onClick={() => commitBox(box.id, "confirm")}>
                Übernehmen
              </ActionBtn>
              <ActionBtn onClick={() => commitBox(box.id, "reject")}>Verwerfen</ActionBtn>
            </>
          )}
        </div>
      )}
    </section>
  );
};

interface ActionBtnProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  icon?: ReactNode;
  disabled?: boolean;
}

export const ActionBtn = forwardRef<HTMLButtonElement, ActionBtnProps>(
  ({ children, onClick, variant = "ghost", icon, disabled }, ref) => {
    const cls =
      variant === "primary"
        ? "text-primary hover:text-primary/80 border-primary/40 hover:border-primary/70"
        : variant === "danger"
          ? "text-destructive/80 hover:text-destructive border-transparent hover:border-destructive/40"
          : "text-muted-foreground/80 hover:text-foreground border-transparent hover:border-border-strong";
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center gap-2 text-base font-light tracking-wide pb-1 border-b transition-colors ${cls} disabled:opacity-40 disabled:pointer-events-none`}
      >
        {icon}
        {children}
      </button>
    );
  },
);
ActionBtn.displayName = "ActionBtn";

export default BoxFrame;
