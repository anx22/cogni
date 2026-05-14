// =============================================================================
//  BatchReviewOverlay (Dialog V2) — kompakte Zeilen-Liste statt Box-Stapel.
//  Hinter Feature-Flag (?dialogV2=1 / localStorage.cogniDialogV2). Nutzt das
//  bestehende useDialog()-Vertrag (commitBox, gateReason, session). Kein
//  eigener Datenfetch. App-Theme wird via [data-dialog] geerbt.
// =============================================================================

import { useMemo } from "react";
import { useDialog } from "./DialogProvider";
import SessionHeader from "./parts/SessionHeader";
import ReviewRow from "./parts/ReviewRow";
import { END_STATES } from "@/lib/dialog/types";

const BatchReviewOverlay = ({ onClose }: { onClose: () => void }) => {
  const { session, commitBox, gateReason } = useDialog();

  const decisionBoxes = useMemo(
    () => session?.boxes.filter((b) => b.type !== "kontext") ?? [],
    [session],
  );

  if (!session) return null;

  const open = decisionBoxes.filter((b) => !END_STATES.includes(b.state)).length;
  const ready = decisionBoxes.length - open;
  const conflicts = decisionBoxes.filter((b) => b.type === "konflikt" && !END_STATES.includes(b.state)).length;
  const gaps = decisionBoxes.filter((b) => (b.type === "gap" || b.type === "eingabe") && !END_STATES.includes(b.state)).length;

  const summaryParts = [`${decisionBoxes.length} Erkenntnisse`];
  if (conflicts > 0) summaryParts.push(`${conflicts} Konflikt${conflicts === 1 ? "" : "e"}`);
  if (gaps > 0) summaryParts.push(`${gaps} Lücke${gaps === 1 ? "" : "n"}`);

  const allReady = open === 0;
  const canBulk = !gateReason && open > 0;

  const handleBulkConfirm = async () => {
    for (const b of decisionBoxes) {
      if (END_STATES.includes(b.state)) continue;
      if (b.type === "konflikt" || b.type === "gap" || b.type === "eingabe" || b.type === "auswahl") continue; // brauchen Eingabe
      await commitBox(b.id, "confirm");
    }
  };

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
            title={gateReason ?? undefined}
          >
            {open > 0 ? `${open} übernehmen` : "Alles bereit"}
            <span className="mono" style={{ opacity: 0.5, fontSize: 12 }}>↵</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchReviewOverlay;
