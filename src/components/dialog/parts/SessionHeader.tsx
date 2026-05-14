// =============================================================================
//  SessionHeader — geteilt von BatchReviewOverlay & FaktDrillOverlay (V2).
// =============================================================================

import { X } from "lucide-react";

interface SessionHeaderProps {
  source: string;
  summary?: string;
  current?: number;
  total?: number;
  onClose: () => void;
}

const SessionHeader = ({ source, summary, current, total, onClose }: SessionHeaderProps) => (
  <header
    className="flex items-center justify-between"
    style={{
      padding: "18px 44px",
      borderBottom: "1px solid var(--d-hair)",
      flex: "0 0 auto",
    }}
  >
    <div className="flex items-center" style={{ gap: 12, fontSize: 13 }}>
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: "var(--d-blue)",
          position: "relative",
        }}
      >
        <span
          style={{
            position: "absolute",
            inset: -3,
            borderRadius: 999,
            background: "var(--d-blue)",
            opacity: 0.25,
            animation: "cogni-pulse 1.8s ease-out infinite",
          }}
        />
      </span>
      <span style={{ color: "var(--d-ink)", fontWeight: 500 }}>Review</span>
      <span style={{ color: "var(--d-ink-3)" }}>·</span>
      <span className="mono" style={{ color: "var(--d-ink-2)", fontSize: 12 }}>
        {source}
      </span>
      {summary && (
        <>
          <span style={{ color: "var(--d-ink-3)" }}>·</span>
          <span style={{ color: "var(--d-ink-3)", fontSize: 12 }}>{summary}</span>
        </>
      )}
    </div>
    <div className="flex items-center" style={{ gap: 14 }}>
      {typeof current === "number" && typeof total === "number" && total > 0 && (
        <span className="mono" style={{ fontSize: 12, color: "var(--d-ink-3)" }}>
          {current} / {total}
        </span>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Schließen"
        className="kbd flex items-center gap-1"
        style={{
          background: "transparent",
          border: "1px solid var(--d-hair-2)",
          color: "var(--d-ink-3)",
          padding: "4px 10px",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        <X size={12} /> esc
      </button>
    </div>
  </header>
);

export default SessionHeader;
