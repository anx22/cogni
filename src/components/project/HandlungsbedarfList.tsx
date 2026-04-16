import { useState } from "react";
import { ChevronRight, User, CalendarClock, Ban } from "lucide-react";
import ObjectToken from "./shared/ObjectToken";
import SourceMarker from "./shared/SourceMarker";
import type { demoProject, Arbeitsmodus } from "@/data/demoProject";

type Item = (typeof demoProject)["handlungsbedarf"][number];

const modeMeta: Record<Arbeitsmodus, { label: string; hint: string; accent: string }> = {
  entscheiden: { label: "Entscheiden", hint: "Richtung festlegen", accent: "text-violet-300/90" },
  klaeren: { label: "Klären", hint: "Information beschaffen", accent: "text-amber-300/90" },
  umsetzen: { label: "Umsetzen", hint: "Arbeit ausführen", accent: "text-emerald-300/90" },
  pruefen: { label: "Prüfen", hint: "Bewerten und antworten", accent: "text-cyan-300/90" },
};

const order: Arbeitsmodus[] = ["entscheiden", "klaeren", "umsetzen", "pruefen"];

const HandlungsbedarfList = ({ items }: { items: Item[] }) => {
  const grouped = order.map((m) => ({
    modus: m,
    items: items.filter((i) => i.arbeitsmodus === m),
  }));

  return (
    <section className="px-8 md:px-12 lg:px-16 xl:px-20 py-14 bg-card/20">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex items-baseline justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">Operatives Zentrum</p>
            <h2 className="text-2xl font-light tracking-tight text-foreground/95">Handlungsbedarf</h2>
          </div>
          <span className="text-xs text-muted-foreground/60">
            {items.length} offen · {items.filter((i) => i.blocker).length} Blocker
          </span>
        </header>

        <div className="space-y-8">
          {grouped.map(({ modus, items }) => {
            if (items.length === 0) return null;
            const meta = modeMeta[modus];
            return (
              <div key={modus}>
                <div className="flex items-baseline gap-3 mb-3 px-1">
                  <h3 className={`text-xs uppercase tracking-[0.2em] font-medium ${meta.accent}`}>
                    {meta.label}
                  </h3>
                  <span className="text-[11px] text-muted-foreground/40">{meta.hint}</span>
                  <span className="text-[11px] text-muted-foreground/40 ml-auto">{items.length}</span>
                </div>
                <div className="rounded-xl border border-border/50 bg-background/40 divide-y divide-border/40 overflow-hidden">
                  {items.map((it) => (
                    <ActionRow key={it.id} item={it} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const ActionRow = ({ item }: { item: Item }) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-card/40 transition-colors text-left"
      >
        <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground/40 transition-transform shrink-0 ${open ? "rotate-90" : ""}`} />
        <ObjectToken typ={item.objektTyp} />
        <span className="text-sm text-foreground/90 flex-1 min-w-0 truncate">{item.titel}</span>

        {item.blocker && (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-destructive/30 bg-destructive/10 text-destructive/90">
            <Ban className="w-3 h-3" /> Blocker
          </span>
        )}

        {item.frist && (
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-muted-foreground/60">
            <CalendarClock className="w-3 h-3" /> {item.frist}
          </span>
        )}
        {item.verantwortlich && (
          <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-muted-foreground/60">
            <User className="w-3 h-3" /> {item.verantwortlich}
          </span>
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 pl-11 animate-[fade-in_0.15s_ease-out]">
          <p className="text-sm text-foreground/75 leading-relaxed mb-3">{item.beschreibung}</p>
          <div className="flex flex-wrap items-center gap-2">
            <SourceMarker quelle={item.quelle} />
            <button className="text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-md bg-primary/15 text-primary/90 hover:bg-primary/25 transition-colors">
              Bearbeiten
            </button>
            <button className="text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-md border border-border/50 text-muted-foreground/80 hover:text-foreground/90 hover:border-border transition-colors">
              Inline antworten
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HandlungsbedarfList;
