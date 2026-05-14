import { useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDestructiveProps {
  trigger?: ReactNode; // not used; controlled via open
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
}

const ConfirmDestructive = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Endgültig löschen",
  cancelLabel = "Abbrechen",
  onConfirm,
}: ConfirmDestructiveProps) => {
  const [busy, setBusy] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <AlertDialogContent className="bg-[hsl(var(--surface-1))] border-border-subtle backdrop-blur-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-light text-foreground">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground/80 leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await onConfirm();
                onOpenChange(false);
              } finally {
                setBusy(false);
              }
            }}
            className="bg-rose-500/80 hover:bg-rose-500 text-white"
          >
            {busy ? "…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDestructive;
