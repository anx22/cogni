import { useState } from "react";
import { Check } from "lucide-react";
import { useDialog } from "../DialogProvider";
import BoxFrame, { ActionBtn } from "../BoxFrame";
import type { DialogBox } from "@/lib/dialog/types";
import { useManualOverrides } from "@/lib/dialog/manualOverrides";

const KonfliktBox = ({ box }: { box: DialogBox }) => {
  const { session, updateBoxPayload, commitBox, closeDialog } = useDialog();
  const { markManual } = useManualOverrides();
  const [choice, setChoice] = useState<"A" | "B" | null>(box.payload?.auswahl ?? null);
  const [reason, setReason] = useState<string>(box.payload?.begruendung ?? "");

  const confirm = () => {
    if (!choice) return;
    updateBoxPayload(box.id, { auswahl: choice, begruendung: reason });
    commitBox(box.id, "confirm", { auswahl: choice, begruendung: reason });
    if (session?.context) markManual(session.context);
    setTimeout(closeDialog, 250);
  };

  return (
    <BoxFrame
      box={box}
      actions={
        <ActionBtn variant="primary" icon={<Check className="w-3 h-3" />} onClick={confirm}>
          Entscheidung übernehmen
        </ActionBtn>
      }
    >
      <p className="text-sm text-muted-foreground">{box.payload?.beschreibung}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(["A", "B"] as const).map((k) => {
          const active = choice === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setChoice(k)}
              className={`text-left rounded-lg border p-3 transition-colors ${
                active
                  ? "border-primary/60 bg-primary/10"
                  : "border-border-subtle bg-surface-3 hover:border-border-strong"
              }`}
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Variante {k}
              </p>
              <p className="text-sm text-foreground/95">{box.payload?.[`fakt${k}`]}</p>
            </button>
          );
        })}
      </div>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Begründung (optional)…"
        rows={2}
        className="w-full text-sm bg-surface-3 border border-border-subtle rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50"
      />
    </BoxFrame>
  );
};

export default KonfliktBox;
