// =============================================================================
//  BatchReviewOverlay (Dialog V2)
//  - Bulk-Confirm zeigt sichtbaren Fortschritt (kein gefühlter Freeze).
//  - Solange offene Zuordnung existiert: Gate-Banner oben, Folge-Zeilen
//    sind sichtbar gesperrt (`blocked` Prop), Bulk-Button sagt es klar.
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import { useDialog } from "./DialogProvider";
import SessionHeader from "./parts/SessionHeader";
import ReviewRow from "./parts/ReviewRow";
import { END_STATES } from "@/lib/dialog/types";
import ConfirmDestructive from "@/components/shared/ConfirmDestructive";
import { toast } from "sonner";

const BULK_CONFIRM_THRESHOLD = 5;
const AUTO_CONFIRMABLE = new Set(["wissen", "aktion", "kontext"]);

const BatchReviewOverlay = ({ onClose }: { onClose: () => void }) => {
  const { session, commitBox, gateReason } = useDialog();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);

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

  const isBulkRunning = bulkProgress !== null;
  const allReady = open === 0;
  const canBulk = !gateReason && autoConfirmable.length > 0 && !isBulkRunning;
  const bulkBlockedReason = gateReason
    ?? (open === 0 ? null : autoConfirmable.length === 0 ? "Nur manuelle Entscheidungen offen" : null);

  // Sortierung: Zuordnung immer ganz oben
  const sortedBoxes = useMemo(() => {
    const z = decisionBoxes.filter((b) => b.type === "zuordnung");
    const rest = decisionBoxes.filter((b) => b.type !== "zuordnung");
    return [...z, ...rest];
  }, [decisionBoxes]);

  const runBulkConfirm = async () => {
    const total = autoConfirmable.length;
    setBulkProgress({ done: 0, total });
    let done = 0;
    try {
      for (const b of autoConfirmable) {
        await commitBox(b.id, "confirm");
        done++;
        setBulkProgress({ done, total });
      }
      if (done > 0) toast.success(`${done} Erkenntnis${done === 1 ? "" : "se"} übernommen`);
    } finally {
      setBulkProgress(null);
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

  const bulkLabel = isBulkRunning
    ? `Übernehme ${bulkProgress!.done}/${bulkProgress!.total}…`
    : gateReason
      ? "Erst Projekt wählen"
      : allReady
        ? "Alles bereit"
        : autoConfirmable.length > 0
          ? `${autoConfirmable.length} übernehmen`
          : `${open} manuell`;

  return (
    <div data-dialog className="dlg2-root dialog-backdrop">
      <SessionHeader
        source={session.anlass}
        summary={summaryParts.join(" · ")}
        current={1}
        total={1}
        onClose={onClose}
        mode="batch"
      />

      {gateReason && (
        <div
          style={{
            margin: "16px 44px 0",
            padding: "10px 14px",
            borderRadius: 10,
            background: "var(--d-warn-soft)",
            border: "1px solid var(--d-warn)",
            color: "var(--d-warn)",
            fontSize: 12.5,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>⚠</span>
          <span>
            <strong style={{ fontWeight: 600 }}>Erst Projekt wählen.</strong>{" "}
            <span style={{ color: "var(--d-ink-2)" }}>
              Danach kannst du die {open - 1} weiteren Erkenntnisse übernehmen.
            </span>
          </span>
        </div>
      )}

      <div className="dlg2-list">
        {sortedBoxes.map((b) => (
          <ReviewRow
            key={b.id}
            box={b}
            projectName={session.projectName ?? null}
            blocked={!!gateReason && b.type !== "zuordnung"}
            blockedReason={gateReason}
            onConfirm={(userDecision) => commitBox(b.id, "confirm", userDecision)}
            onReject={() => commitBox(b.id, "reject")}
          />
        ))}
      </div>

      <div className="dlg2-commitbar">
        <button type="button" className="dlg2-btn-secondary" onClick={onClose} disabled={isBulkRunning}>
          Alle verwerfen
        </button>
        <div className="flex items-center" style={{ gap: 12 }}>
          <span style={{ fontSize: 12.5, color: "var(--d-ink-3)" }}>
            {isBulkRunning ? (
              <span style={{ color: "var(--d-blue)" }}>läuft…</span>
            ) : open > 0 ? (
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
            className={`dlg2-btn-commit${allReady && !isBulkRunning ? " ready" : ""}`}
            onClick={handleBulkConfirm}
            disabled={!canBulk}
            title={bulkBlockedReason ?? undefined}
          >
            {bulkLabel}
            {!isBulkRunning && (
              <span className="mono" style={{ opacity: 0.5, fontSize: 12 }}>↵</span>
            )}
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
