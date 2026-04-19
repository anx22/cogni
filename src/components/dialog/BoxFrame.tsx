import { ReactNode, forwardRef } from "react";
import { Check, X, Pencil, AlertTriangle } from "lucide-react";
import { useDialog } from "./DialogProvider";
import BoxStateBadge from "./BoxStateBadge";
import type { BoxState, DialogBox } from "@/lib/dialog/types";

const stateBarCls: Record<BoxState, string> = {
  vorgeschlagen: "bg-transparent border-l border-dashed border-border-strong",
  aufgeklappt: "bg-primary/60",
  geaendert: "bg-amber-400/70",
  bestaetigt: "bg-emerald-400/60",
  verworfen: "bg-muted-foreground/30",
  eskaliert: "bg-destructive/70",
};

interface BoxFrameProps {
  box: DialogBox;
  children: ReactNode;
  /** When true, hide the default action footer (box renders its own). */
  hideActions?: boolean;
  /** Custom action set. */
  actions?: ReactNode;
}

const BoxFrame = ({ box, children, hideActions, actions }: BoxFrameProps) => {
  const { updateBoxState } = useDialog();
  const dim = box.state === "verworfen";
  const collapsed = box.state === "bestaetigt";

  return (
    <div
      className={`relative rounded-xl border bg-surface-2 shadow-card-glow overflow-hidden transition-opacity ${
        dim ? "opacity-50" : ""
      } ${box.state === "eskaliert" ? "border-destructive/50" : "border-border-subtle"}`}
    >
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${stateBarCls[box.state]}`} />
      <div className="pl-5 pr-5 py-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3
            className={`text-sm font-medium text-foreground/95 ${
              box.state === "verworfen" ? "line-through" : ""
            }`}
          >
            {box.title}
          </h3>
          <BoxStateBadge state={box.state} />
        </div>

        {!collapsed && <div className="space-y-3">{children}</div>}

        {!hideActions && !collapsed && (
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border-subtle/60">
            {actions ?? (
              <>
                <ActionBtn
                  variant="primary"
                  onClick={() => updateBoxState(box.id, "bestaetigt")}
                  icon={<Check className="w-3 h-3" />}
                >
                  Bestätigen
                </ActionBtn>
                <ActionBtn
                  onClick={() => updateBoxState(box.id, "geaendert")}
                  icon={<Pencil className="w-3 h-3" />}
                >
                  Ändern
                </ActionBtn>
                <ActionBtn
                  onClick={() => updateBoxState(box.id, "verworfen")}
                  icon={<X className="w-3 h-3" />}
                >
                  Verwerfen
                </ActionBtn>
                <ActionBtn
                  variant="danger"
                  onClick={() => updateBoxState(box.id, "eskaliert")}
                  icon={<AlertTriangle className="w-3 h-3" />}
                >
                  Eskalieren
                </ActionBtn>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface ActionBtnProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  icon?: ReactNode;
}

export const ActionBtn = forwardRef<HTMLButtonElement, ActionBtnProps>(
  ({ children, onClick, variant = "ghost", icon }, ref) => {
    const cls =
      variant === "primary"
        ? "bg-primary/20 text-primary hover:bg-primary/30 border-primary/40"
        : variant === "danger"
          ? "bg-destructive/15 text-destructive hover:bg-destructive/25 border-destructive/40"
          : "bg-surface-3 text-muted-foreground hover:text-foreground border-border-subtle hover:border-border-strong";
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-md border transition-colors ${cls}`}
      >
        {icon}
        {children}
      </button>
    );
  },
);
ActionBtn.displayName = "ActionBtn";

export default BoxFrame;
