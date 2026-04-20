import { FileText, Layers } from "lucide-react";
import { useDialog } from "@/components/dialog/DialogProvider";
import { buildThemaSession, buildDokumentSession } from "@/lib/dialog/sessionFactories";
import type { ThemaVM, DokumentVM } from "@/lib/project/types";

type Thema = ThemaVM;
type Dok = DokumentVM;

const SubstanzSection = ({ themen, dokumente }: { themen: Thema[]; dokumente: Dok[] }) => {
  const { openDialog } = useDialog();
  // Sortiert: neueste Dokumente zuerst (datum dd.mm.yyyy)
  const sortedDokumente = [...dokumente].sort((a, b) => {
    const toDate = (d: string) => {
      const [dd, mm, yyyy] = d.split(".");
      return new Date(`${yyyy}-${mm}-${dd}`).getTime();
    };
    return toDate(b.datum) - toDate(a.datum);
  });

  return (
    <section className="px-8 md:px-12 lg:px-16 xl:px-20 py-16 bg-surface-0">
      <div className="max-w-7xl mx-auto space-y-14">
        <header>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">Inhalt</p>
          <h2 className="text-2xl font-light tracking-tight text-foreground">Substanz</h2>
        </header>

        {/* Themen — Drilldown-Einstiege */}
        <div>
          <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" /> Themen
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {themen.map((t) => {
              const hasOpen = t.offenePunkte > 0;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => openDialog(buildThemaSession(t))}
                  className="group text-left rounded-xl border border-border-subtle bg-surface-2 shadow-card-glow hover:bg-surface-3 hover:border-border-strong transition-all px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h4 className="text-base text-foreground font-medium flex items-center gap-2">
                      {t.name}
                      {hasOpen && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-amber-400/80"
                          title={`${t.offenePunkte} offene Punkte`}
                        />
                      )}
                    </h4>
                    <span className="text-[11px] text-muted-foreground/60 group-hover:text-foreground/90 transition-colors">→</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{t.beschreibung}</p>
                  <div className="flex gap-4 text-[11px] text-muted-foreground/70">
                    <span>{t.entscheidungen} Entscheidungen</span>
                    <span>{t.offenePunkte} offen</span>
                    <span>{t.dokumente} Dokumente</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dokumente */}
        <div>
          <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> Dokumente
          </h3>
          <div className="rounded-xl border border-border-subtle bg-surface-2 shadow-card-glow divide-y divide-border-subtle overflow-hidden">
            {sortedDokumente.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => openDialog(buildDokumentSession(d))}
                className="w-full flex items-center gap-4 px-5 py-3 hover:bg-surface-3 transition-colors text-left"
              >
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-mono w-10">{d.typ}</span>
                <span className="text-sm text-foreground/95 flex-1 min-w-0 truncate">{d.name}</span>
                {d.thema && (
                  <span className="hidden md:inline text-[11px] text-muted-foreground">{d.thema}</span>
                )}
                <span className="text-[11px] text-muted-foreground">v{d.version}</span>
                <span className="text-[11px] text-muted-foreground/70 font-mono">{d.datum}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubstanzSection;
