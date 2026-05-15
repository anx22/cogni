import { useState } from "react";
import { ChevronRight, User, CalendarClock, Ban } from "lucide-react";
import ObjectToken from "./shared/ObjectToken";
import SourceMarker from "./shared/SourceMarker";
import SectionLabel from "./shared/SectionLabel";
import CardSurface from "./shared/CardSurface";
import RoleHeader from "./shared/RoleHeader";
import { useDialog } from "@/components/dialog/DialogProvider";
import { buildHandlungsbedarfSession } from "@/lib/dialog/sessionFactories";
import type { Arbeitsmodus, HandlungsbedarfVM } from "@/lib/project/types";

type Item = HandlungsbedarfVM;

const modeMeta: Record<Arbeitsmodus, { label: string; hint: string; color: string; soft: string }> = {
  entscheiden: { label: "Entscheiden", hint: "Richtung festlegen", color: "var(--sig-action)", soft: "var(--sig-action-soft)" },
  klaeren: { label: "Klären", hint: "Information beschaffen", color: "var(--sig-review)", soft: "var(--sig-review-soft)" },
  umsetzen: { label: "Umsetzen", hint: "Arbeit ausführen", color: "var(--sig-calm)", soft: "var(--sig-calm-soft)" },
  pruefen: { label: "Prüfen", hint: "Bewerten und antworten", color: "var(--c-accent)", soft: "var(--c-accent-soft)" },
};

const order: Arbeitsmodus[] = ["entscheiden", "klaeren", "umsetzen", "pruefen"];

const HandlungsbedarfList = ({ items }: { items: Item[] }) => {
  const grouped = order.map((m) => ({
    modus: m,
    items: items.filter((i) => i.arbeitsmodus === m),
  }));

  return (
    <div>
      <div>
        <RoleHeader
          role="handlung"
          title="Handlungsbedarf"
          right={
            <span>
              {items.length} offen · {items.filter((i) => i.blocker).length} Blocker
            </span>
          }
        />


        <div className="space-y-8">
          {grouped.map(({ modus, items }) => {
            if (items.length === 0) return null;
            const meta = modeMeta[modus];
            return (
              <div key={modus}>
                <div className="flex items-baseline gap-3 mb-3 px-1">
                  <span className="w-2 h-2 rounded-sm self-center" style={{ background: meta.color }} />
                  <h3 className="text-xs uppercase tracking-[0.2em] font-medium" style={{ color: meta.color }}>
                    {meta.label}
                  </h3>
                  <span className="text-[11px] text-muted-foreground/60">{meta.hint}</span>
                  <span className="text-[11px] text-muted-foreground/60 ml-auto">{items.length}</span>
                </div>
                <CardSurface divideRows overflowHidden>
                  {items.map((it) => (
                    <ActionRow key={it.id} item={it} barColor={meta.color} />
                  ))}
                </CardSurface>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ActionRow = ({ item, barColor }: { item: Item; barColor: string }) => {
  const [open, setOpen] = useState(false);
  const { openDialog } = useDialog();
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-3 transition-colors text-left"
      >
        <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground/60 transition-transform shrink-0 ${open ? "rotate-90" : ""}`} />
        <ObjectToken typ={item.objektTyp} />
        <span className="text-sm text-foreground/95 flex-1 min-w-0 truncate">{item.titel}</span>

        {item.blocker && (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-destructive/50 bg-destructive/15 text-destructive">
            <Ban className="w-3 h-3" /> Blocker
          </span>
        )}

        {item.frist && (
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <CalendarClock className="w-3 h-3" /> {item.frist}
          </span>
        )}
        {item.verantwortlich && (
          <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <User className="w-3 h-3" /> {item.verantwortlich}
          </span>
        )}
      </button>

      {open && (
        <div className="relative bg-surface-1 px-4 py-4 pl-11 animate-[fade-in_0.15s_ease-out]">
          <span className="absolute left-4 top-3 bottom-3 w-0.5 rounded-full" style={{ background: barColor, opacity: 0.7 }} />
          <p className="text-sm text-foreground/90 leading-relaxed mb-3">{item.beschreibung}</p>
          <div className="flex flex-wrap items-center gap-2">
            <SourceMarker quelle={item.quelle} manuell={item.manuell} />
            <button
              onClick={() => openDialog(buildHandlungsbedarfSession(item))}
              className="text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-md bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
            >
              Antworten
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HandlungsbedarfList;
