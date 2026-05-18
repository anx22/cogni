import { ChevronRight } from "lucide-react";
import { useDialog } from "@/components/dialog/DialogProvider";
import { buildThemaSession, buildDokumentSession } from "@/lib/dialog/sessionFactories";
import type { ThemaVM, DokumentVM } from "@/lib/project/types";

const SubstanzSection = ({
  themen,
  dokumente,
}: {
  themen: ThemaVM[];
  dokumente: DokumentVM[];
}) => {
  const { openDialog } = useDialog();

  const sortedDokumente = [...dokumente].sort((a, b) => {
    const toDate = (d: string) => {
      const [dd, mm, yyyy] = d.split(".");
      return new Date(`${yyyy}-${mm}-${dd}`).getTime();
    };
    return toDate(b.datum) - toDate(a.datum);
  });

  return (
    <section
      className="bg-surface-0 border-t border-border-strong"
      style={{ marginTop: 40, padding: "32px 56px 48px" }}
    >
      <header
        className="flex items-baseline justify-between"
        style={{ marginBottom: 22 }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: "-.015em",
            color: "var(--ink-2)",
          }}
        >
          Substanz
        </h2>
        <span className="t-micro" style={{ color: "var(--ink-4)" }}>
          Themen · Dokumente
        </span>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 36 }}>
        {/* Themen */}
        <div>
          <div className="t-micro" style={{ color: "var(--ink-3)", marginBottom: 12 }}>
            Themen{" "}
            <span className="mono tabular" style={{ marginLeft: 6, color: "var(--ink-4)" }}>
              {themen.length}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {themen.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => openDialog(buildThemaSession(t))}
                className="text-left group"
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "var(--surface-2)",
                  border: "1px solid var(--hair)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      color: "var(--ink)",
                      fontWeight: 500,
                      letterSpacing: "-.005em",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.name}
                  </div>
                  <div
                    className="mono tabular"
                    style={{ marginTop: 4, fontSize: 11, color: "var(--ink-3)" }}
                  >
                    {t.entscheidungen}·{t.offenePunkte}·{t.dokumente}
                  </div>
                </div>
                <ChevronRight
                  className="shrink-0 transition-colors"
                  style={{ width: 14, height: 14, color: "var(--ink-4)" }}
                />
              </button>
            ))}
            {themen.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--ink-3)", fontStyle: "italic" }}>
                Noch keine Themen.
              </p>
            )}
          </div>
        </div>

        {/* Dokumente */}
        <div>
          <div className="t-micro" style={{ color: "var(--ink-3)", marginBottom: 12 }}>
            Dokumente{" "}
            <span className="mono tabular" style={{ marginLeft: 6, color: "var(--ink-4)" }}>
              {sortedDokumente.length}
            </span>
          </div>
          <div className="flex flex-col">
            {sortedDokumente.map((d, i) => (
              <button
                key={d.id}
                type="button"
                onClick={() => openDialog(buildDokumentSession(d))}
                className="w-full flex items-center text-left"
                style={{
                  gap: 10,
                  padding: "10px 4px",
                  borderBottom:
                    i === sortedDokumente.length - 1 ? "none" : "1px solid var(--hair)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <span className="src shrink-0" style={{ width: 36 }}>
                  {d.typ}
                </span>
                <span
                  className="flex-1 min-w-0 truncate"
                  style={{ fontSize: 13, color: "var(--ink)" }}
                >
                  {d.name}
                </span>
                <span
                  className="mono tabular shrink-0"
                  style={{ fontSize: 11, color: "var(--ink-3)" }}
                >
                  v{d.version}
                </span>
                <span
                  className="mono tabular shrink-0"
                  style={{ fontSize: 11, color: "var(--ink-3)" }}
                >
                  {d.datum}
                </span>
              </button>
            ))}
            {sortedDokumente.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--ink-3)", fontStyle: "italic" }}>
                Noch keine Dokumente.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubstanzSection;
