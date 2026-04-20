import { useState, useMemo } from "react";
import DeltaTag from "./shared/DeltaTag";
import SourceMarker from "./shared/SourceMarker";
import FeedbackButton from "./shared/FeedbackButton";
import { useDialog } from "@/components/dialog/DialogProvider";
import { buildVerlaufSession } from "@/lib/dialog/sessionFactories";
import type { VerlaufVM } from "@/lib/project/types";

type FilterTyp = "alle" | "aenderung" | "entscheidung" | "konflikt" | "upload" | "milestone";

const filters: { id: FilterTyp; label: string }[] = [
  { id: "alle", label: "Alle" },
  { id: "aenderung", label: "Änderungen" },
  { id: "entscheidung", label: "Entscheidungen" },
  { id: "konflikt", label: "Konflikte" },
  { id: "upload", label: "Uploads" },
  { id: "milestone", label: "Milestones" },
];

const VerlaufFeed = ({ verlauf }: { verlauf: VerlaufVM[] }) => {
  const [filter, setFilter] = useState<FilterTyp>("alle");
  const { openDialog } = useDialog();

  const filtered = useMemo(
    () => (filter === "alle" ? verlauf : verlauf.filter((v) => v.ereignisTyp === filter)),
    [filter, verlauf],
  );

  return (
    <div>
      <div>
        <header className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">Chronologie</p>
          <h2 className="text-2xl font-light tracking-tight text-foreground">Verlauf</h2>
        </header>

        <div className="flex flex-wrap gap-2 mb-8">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${
                filter === f.id
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "border-border-subtle bg-surface-2 text-muted-foreground hover:text-foreground hover:border-border-strong"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface-2 shadow-card-glow p-6 max-h-[720px] overflow-y-auto">
          <div className="relative pl-6 border-l border-border-strong space-y-5">
            {filtered.map((e) => {
              const isConflict = e.ereignisTyp === "konflikt" || e.delta === "widersprochen";
              return (
                <div
                  key={e.id}
                  className="group relative cursor-pointer"
                  onClick={() => openDialog(buildVerlaufSession(e))}
                >
                  <div className={`absolute -left-[27px] top-1.5 w-2 h-2 rounded-full ring-4 ring-surface-2 ${
                    isConflict ? "bg-destructive/80" : "bg-muted-foreground/60"
                  }`} />
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                    <span className="text-[11px] text-muted-foreground/70 font-mono">{e.datum}</span>
                    <DeltaTag delta={e.delta} />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{e.objekt}</span>
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <FeedbackButton context={e.inhalt} label="" />
                    </div>
                  </div>
                  <p className="text-sm text-foreground/95 leading-snug mb-1.5 group-hover:text-foreground transition-colors">
                    {e.inhalt}
                  </p>
                  <SourceMarker quelle={e.quelle} manuell={e.manuell} />
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground italic">Keine Einträge in diesem Filter.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerlaufFeed;
