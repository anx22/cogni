import { useState } from "react";
import { Check } from "lucide-react";
import { useDialog } from "../DialogProvider";
import BoxFrame, { ActionBtn } from "../BoxFrame";
import type { DialogBox } from "@/lib/dialog/types";
import { useManualOverrides } from "@/lib/dialog/manualOverrides";

const KonfliktBox = ({ box }: { box: DialogBox }) => {
  const { session, updateBoxPayload, commitBox, closeDialog, readonly } = useDialog();
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
        <ActionBtn variant="primary" icon={<Check className="w-4 h-4" />} onClick={confirm}>
          Entscheidung übernehmen
        </ActionBtn>
      }
    >
      {box.payload?.beschreibung && (
        <p className="text-lg text-foreground/80 font-light leading-relaxed">
          {box.payload.beschreibung}
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(["A", "B"] as const).map((k) => {
          const active = choice === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => !readonly && setChoice(k)}
              className={`text-left rounded-lg p-5 transition-colors border ${
                active
                  ? "border-primary/60 bg-primary/10"
                  : "border-border-subtle bg-surface-2/40 hover:border-border-strong"
              } ${readonly ? "pointer-events-none" : ""}`}
            >
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground/60 mb-2">
                Variante {k}
              </p>
              <p className="text-lg text-foreground/95 font-light leading-snug">
                {box.payload?.[`fakt${k}`]}
              </p>
            </button>
          );
        })}
      </div>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Begründung (optional)…"
        rows={2}
        readOnly={readonly}
        className="w-full text-lg font-light bg-transparent border-b border-border-strong px-1 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
      />
    </BoxFrame>
  );
};

export default KonfliktBox;
