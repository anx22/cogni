// =============================================================================
//  deltaTokens — geteilte Provenienz-Marker für Review/Drill.
//  Eine Quelle für DeltaChip (was der Linker tat) + RefToken (Bezugsobjekt),
//  damit ReviewRow (Batch) und FaktDrillOverlay (Drill) identisch aussehen.
//  PRODUCT-Versprechen: jede Erkenntnis zeigt Quelle und Delta.
// =============================================================================

/** Linker-Ergebnis → Label + Farben. `confirm` trägt nichts (Default). */
const DELTA_TAGS: Record<string, { label: string; bg: string; fg: string }> = {
  add: { label: "neu", bg: "var(--d-blue-soft)", fg: "var(--d-blue)" },
  replace: { label: "ersetzt", bg: "var(--d-warn-soft)", fg: "var(--d-warn)" },
  contradict: { label: "widersprochen", bg: "var(--d-warn-soft)", fg: "var(--d-warn)" },
  merge: { label: "verbunden", bg: "var(--d-surf-3)", fg: "var(--d-ink-3)" },
};

export const DeltaChip = ({
  delta,
  marginLeft = 8,
}: {
  delta: string | null | undefined;
  /** Standard 8 (ReviewRow ohne flex-gap); im Drill-Header mit gap → 0. */
  marginLeft?: number;
}) => {
  if (!delta) return null;
  const cfg = DELTA_TAGS[delta];
  if (!cfg) return null;
  return (
    <span
      className="mono"
      style={{
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        padding: "3px 7px",
        borderRadius: 5,
        background: cfg.bg,
        color: cfg.fg,
        marginLeft,
        flex: "0 0 auto",
      }}
      title={`Linker: ${delta}`}
    >
      {cfg.label}
    </span>
  );
};

/** Mini-Token: zeigt das Bezugsobjekt, an das eine Modalität anknüpft. */
export const RefToken = ({ to, label }: { to: string; label?: string }) => (
  <span
    className="mono"
    style={{
      fontSize: 10.5,
      padding: "2px 8px",
      borderRadius: 999,
      border: "1px solid var(--d-hair-2)",
      color: "var(--d-ink-3)",
      background: "var(--d-surf-3)",
      flex: "0 0 auto",
    }}
    title={`${label ?? "Bezug"}: ${to}`}
  >
    {label ? `${label}: ${to}` : `→ ${to}`}
  </span>
);
