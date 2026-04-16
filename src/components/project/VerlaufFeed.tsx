import { useState, useMemo } from "react";
import DeltaTag from "./shared/DeltaTag";
import SourceMarker from "./shared/SourceMarker";
import type { demoProject } from "@/data/demoProject";

type Eintrag = (typeof demoProject)["verlauf"][number];

type FilterTyp = "alle" | "aenderung" | "entscheidung" | "konflikt" | "upload" | "milestone";

const filters: { id: FilterTyp; label: string }[] = [
  { id: "alle", label: "Alle" },
  { id: "aenderung", label: "Änderungen" },
  { id: "entscheidung", label: "Entscheidungen" },
  { id: "konflikt", label: "Konflikte" },
  { id: "upload", label: "Uploads" },
  { id: "milestone", label: "Milestones" },
];

const VerlaufFeed = ({ verlauf }: { verlauf: Eintrag[] }) => {
  const [filter, setFilter] = useState<FilterTyp>("alle");

  const filtered = useMemo(
    () => (filter === "alle" ? verlauf : verlauf.filter((v) => v.ereignisTyp === filter)),
    [filter, verlauf],
  );

  return (
    <section className="px-8 md:px-12 lg:px-16 xl:px-20 py-14 border-t border-border/40">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">Chronologie</p>
          <h2 className="text-2xl font-light tracking-tight text-foreground/95">Verlauf</h2>
        </header>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${
                filter === f.id
                  ? "bg-primary/15 text-primary/90 border-primary/30"
                  : "border-border/40 text-muted-foreground/60 hover:text-foreground/80 hover:border-border/70"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative pl-6 border-l border-border/40 space-y-5">
          {filtered.map((e) => (
            <div key={e.id} className="relative">
              <div className="absolute -left-[27px] top-1.5 w-2 h-2 rounded-full bg-muted-foreground/30 ring-4 ring-background" />
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                <span className="text-[11px] text-muted-foreground/50 font-mono">{e.datum}</span>
                <DeltaTag delta={e.delta} />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40">{e.objekt}</span>
              </div>
              <p className="text-sm text-foreground/85 leading-snug mb-1.5">{e.inhalt}</p>
              <SourceMarker quelle={e.quelle} />
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground/50 italic">Keine Einträge in diesem Filter.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default VerlaufFeed;
