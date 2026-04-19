import { HelpCircle, GitBranch } from "lucide-react";
import { useDialog } from "@/components/dialog/DialogProvider";
import { buildGapSession, buildHandlungsbedarfSession } from "@/lib/dialog/sessionFactories";
import type { demoProject } from "@/data/demoProject";

type Gap = (typeof demoProject)["gaps"][number];
type Dep = (typeof demoProject)["dependencies"][number];

const depLabel: Record<Dep["typ"], string> = {
  blockiert_durch: "blockiert durch",
  wartet_auf: "wartet auf",
  haengt_ab_von: "hängt ab von",
};

const SignalStrip = ({ gaps, dependencies }: { gaps: Gap[]; dependencies: Dep[] }) => {
  const { openDialog } = useDialog();
  if (gaps.length === 0 && dependencies.length === 0) return null;

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-2 shadow-card-glow px-5 py-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-3">Signale</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
        {/* Gaps */}
        <div>
          <div className="flex items-center gap-1.5 text-amber-300/90 mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-wider font-medium">
              {gaps.length} {gaps.length === 1 ? "Lücke" : "Lücken"}
            </span>
          </div>
          <ul className="space-y-1.5">
            {gaps.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => openDialog(buildGapSession(g))}
                  className="w-full text-left text-xs text-foreground/90 hover:text-foreground transition-colors leading-snug"
                  title={`${g.wirkung} · betrifft ${g.betrifft} · ${g.lebensdauer}`}
                >
                  <span className="text-foreground/95">{g.titel}</span>
                  <span className="text-muted-foreground/70"> · {g.lebensdauer}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Dependencies */}
        <div>
          <div className="flex items-center gap-1.5 text-cyan-300/90 mb-2">
            <GitBranch className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-wider font-medium">
              {dependencies.length} {dependencies.length === 1 ? "Abhängigkeit" : "Abhängigkeiten"}
            </span>
          </div>
          <ul className="space-y-1.5">
            {dependencies.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() =>
                    openDialog(
                      buildHandlungsbedarfSession({
                        id: d.id,
                        titel: `${d.quelle} ${depLabel[d.typ]} ${d.ziel}`,
                        beschreibung: d.beschreibung,
                        quelle: `Dependency #${d.id}`,
                      }),
                    )
                  }
                  className="w-full text-left text-xs text-foreground/90 hover:text-foreground transition-colors leading-snug"
                >
                  <span className="text-foreground/95">{d.quelle}</span>
                  <span className="text-muted-foreground/70"> {depLabel[d.typ]} </span>
                  <span className="text-foreground/80">{d.ziel}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SignalStrip;
