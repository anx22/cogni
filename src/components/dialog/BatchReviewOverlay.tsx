// =============================================================================
//  BatchReviewOverlay (Dialog V2) — kompakte Zeilen-Liste statt Box-Stapel.
//  Hinter Feature-Flag (?dialogV2=1 / localStorage.cogniDialogV2). Nutzt das
//  bestehende useDialog()-Vertrag (commitBox, gateReason, session). Kein
//  eigener Datenfetch. App-Theme wird via [data-dialog] geerbt.
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import { useDialog } from "./DialogProvider";
import SessionHeader from "./parts/SessionHeader";
import ReviewRow from "./parts/ReviewRow";
import { END_STATES } from "@/lib/dialog/types";
import ConfirmDestructive from "@/components/shared/ConfirmDestructive";
import { toast } from "sonner";

/** Schwelle, ab der Bulk-Confirm einen Bestätigungsdialog auslöst. */
const BULK_CONFIRM_THRESHOLD = 5;

/** Box-Typen, die ohne weitere User-Eingabe automatisch bestätigt werden können. */
const AUTO_CONFIRMABLE = new Set(["wissen", "aktion", "zuordnung", "kontext"]);

const BatchReviewOverlay = ({ onClose }: { onClose: () => void }) => {
  const { session, commitBox, gateReason } = useDialog();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const decisionBoxes = useMemo(
    () => session?.boxes.filter((b) => b.type !== "kontext") ?? [],
    [session],
  );

  const openBoxes = decisionBoxes.filter((b) => !END_STATES.includes(b.state));
  const autoConfirmable = openBoxes.filter((b) => AUTO_CONFIRMABLE.has(b.type));
  const open = openBoxes.length;
  const ready = decisionBoxes.length - open;
  const conflicts = decisionBoxes.filter((b) => b.type === "konflikt" && !END_STATES.includes(b.state)).length;
  const gaps = decisionBoxes.filter((b) => (b.type === "gap" || b.type === "eingabe") && !END_STATES.includes(b.state)).length;

  const summaryParts = [`${decisionBoxes.length} Erkenntnisse`];
  if (conflicts > 0) summaryParts.push(`${conflicts} Konflikt${conflicts === 1 ? "" : "e"}`);
  if (gaps > 0) summaryParts.push(`${gaps} Lücke${gaps === 1 ? "" : "n"}`);

  const allReady = open === 0;
  // Nur enabled, wenn ≥1 Box wirklich auto-bestätigbar ist.
  const canBulk = !gateReason && autoConfirmable.length > 0;
  const bulkBlockedReason = gateReason
    ?? (open === 0 ? null : autoConfirmable.length === 0 ? "Nur manuelle Entscheidungen offen" : null);

  const runBulkConfirm = async () => {
    let count = 0;
    for (const b of autoConfirmable) {
      await commitBox(b.id, "confirm");
      count++;
    }
    if (count > 0) {
      toast.success(`${count} Erkenntnis${count === 1 ? "" : "se"} übernommen`);
    }
  };

  const handleBulkConfirm = async () => {
    if (!canBulk) {
      if (bulkBlockedReason) toast.message(bulkBlockedReason);
      return;
    }
    if (autoConfirmable.length >= BULK_CONFIRM_THRESHOLD) {
      setConfirmOpen(true);
      return;
    }
    await runBulkConfirm();
  };

  // Enter im Overlay → Bulk-Confirm (nur wenn Fokus außerhalb von Inputs).
  useEffect(() => {
    if (!session) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || t?.isContentEditable) return;
      if (!canBulk) return;
      e.preventDefault();
      void handleBulkConfirm();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, canBulk, autoConfirmable.length]);

  if (!session) return null;

  return (
    <div data-dialog className="dlg2-root dialog-backdrop">
      <SessionHeader
        source={session.anlass}
        summary={summaryParts.join(" · ")}
        current={1}
        total={1}
        onClose={onClose}
      />

      <div className="dlg2-list">
        {decisionBoxes.map((b) => (
          <ReviewRow
            key={b.id}
            box={b}
            projectName={session.projectName ?? null}
            onConfirm={(userDecision) => commitBox(b.id, "confirm", userDecision)}
            onReject={() => commitBox(b.id, "reject")}
          />
        ))}
      </div>

      <div className="dlg2-commitbar">
        <button type="button" className="dlg2-btn-secondary" onClick={onClose}>
          Schließen
        </button>
        <div className="flex items-center" style={{ gap: 12 }}>
          <span style={{ fontSize: 12.5, color: "var(--d-ink-3)" }}>
            {open > 0 ? (
              <>
                <span style={{ color: "var(--d-warn)", fontWeight: 500 }}>{open} offen</span>
                {" · "}{ready} bereit
              </>
            ) : (
              <>{ready} bereit</>
            )}
          </span>
          <button
            type="button"
            className={`dlg2-btn-commit${allReady ? " ready" : ""}`}
            onClick={handleBulkConfirm}
            disabled={!canBulk}
            title={bulkBlockedReason ?? undefined}
          >
            {allReady
              ? "Alles bereit"
              : autoConfirmable.length > 0
                ? `${autoConfirmable.length} übernehmen`
                : `${open} manuell`}
            <span className="mono" style={{ opacity: 0.5, fontSize: 12 }}>↵</span>
          </button>
        </div>
      </div>

      <ConfirmDestructive
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`${autoConfirmable.length} Erkenntnisse übernehmen?`}
        description="Bestätigte Erkenntnisse fließen sofort in den Projektzustand. Eine Rücknahme ist nicht möglich — prüfe die Liste vorher kurz."
        confirmLabel="Alle übernehmen"
        cancelLabel="Abbrechen"
        onConfirm={runBulkConfirm}
      />
    </div>
  );
};

export default BatchReviewOverlay;
