import DeltaTag from "./shared/DeltaTag";
import { useDialog } from "@/components/dialog/DialogProvider";
import { buildVerlaufSession } from "@/lib/dialog/sessionFactories";
import type { DeltaTyp, VerlaufVM } from "@/lib/project/types";

const DOT_COLOR: Record<DeltaTyp, string> = {
  neu: "var(--sig-action)",
  ersetzt: "var(--sig-review)",
  bestaetigt: "var(--ink-3)",
  widersprochen: "var(--sig-conflict)",
  unclear: "var(--sig-review)",
};

const VerlaufFeed = ({ verlauf }: { verlauf: VerlaufVM[] }) => {
  const { openDialog } = useDialog();

  return (
    <section
      style={{
        padding: "0 0 0 32px",
        borderLeft: "1px solid var(--hair)",
      }}
    >
      <header className="flex items-baseline" style={{ gap: 10, marginBottom: 22 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 500,
            letterSpacing: "-.018em",
            color: "var(--ink)",
          }}
        >
          Verlauf
        </h2>
        <span className="mono tabular" style={{ fontSize: 12, color: "var(--ink-3)" }}>
          {verlauf.length}
        </span>
      </header>

      <div className="flex flex-col relative" style={{ gap: 16 }}>
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 6,
            top: 4,
            bottom: 4,
            width: 1,
            background: "var(--hair)",
          }}
        />
        {verlauf.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => openDialog(buildVerlaufSession(e))}
            className="w-full text-left flex relative group"
            style={{
              gap: 14,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 13,
                height: 13,
                borderRadius: 999,
                marginTop: 4,
                background: "var(--surface-1)",
                border: `2px solid ${DOT_COLOR[e.delta]}`,
                flex: "0 0 auto",
                position: "relative",
                zIndex: 1,
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center" style={{ gap: 8 }}>
                <span className="mono tabular" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                  {e.datum}
                </span>
                <DeltaTag delta={e.delta} />
              </div>
              <div
                className="group-hover:text-foreground transition-colors"
                style={{ marginTop: 4, fontSize: 13.5, color: "var(--ink)", lineHeight: 1.4 }}
              >
                {e.inhalt}
              </div>
            </div>
          </button>
        ))}
        {verlauf.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--ink-3)", fontStyle: "italic" }}>
            Noch kein Verlauf.
          </p>
        )}
      </div>
    </section>
  );
};

export default VerlaufFeed;
