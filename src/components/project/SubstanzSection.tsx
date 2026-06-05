import { ChevronRight } from "lucide-react";
import { useDialog } from "@/components/dialog/DialogProvider";
import { buildThemaSession, buildDokumentSession } from "@/lib/dialog/sessionFactories";
import type { ThemaVM, DokumentVM } from "@/lib/project/types";
import FeedbackButton from "./shared/FeedbackButton";

const SubstanzSection = ({
  themen,
  dokumente,
  projectId,
}: {
  themen: ThemaVM[];
  dokumente: DokumentVM[];
  projectId?: string | null;
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
      <header className="flex items-baseline justify-between" style={{ marginBottom: 22 }}>
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
        <span className="flex items-center gap-3">
          <span className="t-micro" style={{ color: "var(--ink-4)" }}>
            Themen · Dokumente
          </span>
          <FeedbackButton context="Substanz" projectId={projectId} />
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {themen.map((t) => {
              const stats: string[] = [];
              if (t.entscheidungen)
                stats.push(`${t.entscheidungen} Entscheidung${t.entscheidungen === 1 ? "" : "en"}`);
              if (t.offenePunkte) stats.push(`${t.offenePunkte} offen`);
              if (t.dokumente) stats.push(`${t.dokumente} Dokument${t.dokumente === 1 ? "" : "e"}`);
              const preview = (t.items ?? []).slice(0, 2);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => openDialog(buildThemaSession(t))}
                  className="text-left group"
                  style={{
                    padding: "14px 16px",
                    borderRadius: 12,
                    background: "var(--surface-1)",
                    border: "1px solid var(--hair)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    minHeight: 88,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 14,
                        color: "var(--ink)",
                        fontWeight: 500,
                        letterSpacing: "-.005em",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.name}
                    </span>
                    <ChevronRight
                      className="shrink-0 transition-colors"
                      style={{ width: 14, height: 14, color: "var(--ink-4)" }}
                    />
                  </div>
                  {t.beschreibung && (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "var(--ink-3)",
                        lineHeight: 1.4,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {t.beschreibung}
                    </div>
                  )}
                  {preview.length > 0 && (
                    <ul
                      style={{
                        margin: 0,
                        padding: 0,
                        listStyle: "none",
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      {preview.map((it) => (
                        <li
                          key={it.id}
                          style={{ fontSize: 12, color: "var(--ink-2)", display: "flex", gap: 6 }}
                        >
                          <span style={{ color: "var(--ink-4)" }}>·</span>
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {it.titel}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {stats.length > 0 && (
                    <div
                      className="mono"
                      style={{ fontSize: 10.5, color: "var(--ink-4)", marginTop: "auto" }}
                    >
                      {stats.join(" · ")}
                    </div>
                  )}
                </button>
              );
            })}
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
                  borderBottom: i === sortedDokumente.length - 1 ? "none" : "1px solid var(--hair)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <span
                  className="shrink-0 inline-flex items-center justify-center"
                  style={{
                    width: 36,
                    height: 22,
                    borderRadius: 6,
                    background: "var(--surface-2)",
                    color: "var(--ink-2)",
                    fontFamily: "Geist Mono, monospace",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: ".04em",
                    textTransform: "uppercase",
                  }}
                >
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
