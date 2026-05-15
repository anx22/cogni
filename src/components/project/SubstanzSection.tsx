import { FileText, Layers } from "lucide-react";
import { useDialog } from "@/components/dialog/DialogProvider";
import { buildThemaSession, buildDokumentSession } from "@/lib/dialog/sessionFactories";
import RoleHeader from "./shared/RoleHeader";
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
      <div className="max-w-7xl mx-auto" style={{ display: "flex", flexDirection: "column", gap: 96 }}>
        <RoleHeader role="substanz" title="Substanz" />

        {/* Dokumente — Quellenliste, kompakt, Hairline-Dividers */}
        <div>
          <h3 className="t-micro text-muted-foreground mb-4 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> Dokumente
            <span className="ml-2 text-muted-foreground/50">{sortedDokumente.length}</span>
          </h3>
          <div className="divide-y divide-border-subtle/40">
            {sortedDokumente.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => openDialog(buildDokumentSession(d))}
                className="w-full flex items-center gap-4 px-1 py-2.5 hover:bg-surface-2/40 transition-colors text-left rounded-sm"
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

        {/* Themen — Drilldown-Einstiege, Karten, Räume zum Reingehen */}
        <div>
          <h3 className="t-micro text-muted-foreground mb-5 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" /> Themen
            <span className="ml-2 text-muted-foreground/50">{themen.length}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {themen.map((t) => {
              const hasOpen = t.offenePunkte > 0;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => openDialog(buildThemaSession(t))}
                  className="group text-left rounded-xl border border-border-subtle bg-surface-2 shadow-card-glow hover:bg-surface-3 hover:border-border-strong hover:-translate-y-0.5 transition-all px-5 py-5"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
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
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">{t.beschreibung}</p>
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
      </div>
    </section>
  );
};

export default SubstanzSection;
