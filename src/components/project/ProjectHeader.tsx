import { useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";

interface Konflikt {
  id: string;
  typ: string;
  title: string;
  beschreibung: string;
  faktA: string;
  faktB: string;
  status: string;
}

interface ProjectHeaderProps {
  project: {
    name: string;
    lagetext: string;
    stats: {
      konflikte: number;
      offenePunkte: number;
      entscheidungenOffen: number;
      letzteAenderung: string;
      naechsterTermin: string;
    };
    konflikte: Konflikt[];
  };
}

const ProjectHeader = ({ project }: ProjectHeaderProps) => {
  const [konfliktOpen, setKonfliktOpen] = useState(false);
  const hasKonflikte = project.konflikte.length > 0;

  return (
    <div className="pt-16 pb-6 px-8 md:px-12 lg:px-16 xl:px-20">
      {/* Project name */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-foreground mb-5">
        {project.name}
      </h1>

      {/* Lage summary text */}
      <p className="text-base md:text-lg text-muted-foreground/80 max-w-3xl leading-relaxed mb-6">
        {project.lagetext}
      </p>

      {/* Compact stat chips */}
      <div className="flex flex-wrap gap-3 mb-6">
        <StatChip label="Offene Punkte" value={project.stats.offenePunkte} />
        <StatChip label="Entscheidungen offen" value={project.stats.entscheidungenOffen} />
        <StatChip label="Letzte Änderung" value={project.stats.letzteAenderung} variant="neutral" />
        <StatChip label="Nächster Termin" value={project.stats.naechsterTermin} variant="neutral" />
      </div>

      {/* Conditional Conflict Banner */}
      {hasKonflikte && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 backdrop-blur-sm overflow-hidden">
          <button
            onClick={() => setKonfliktOpen(!konfliktOpen)}
            className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-destructive/10 transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-destructive/80 shrink-0" />
            <span className="text-sm font-medium text-destructive/90">
              {project.konflikte.length} {project.konflikte.length === 1 ? "Konflikt" : "Konflikte"} blockieren Fortschritt
            </span>
            <ChevronDown
              className={`w-4 h-4 text-destructive/50 ml-auto transition-transform duration-200 ${konfliktOpen ? "rotate-180" : ""}`}
            />
          </button>

          {konfliktOpen && (
            <div className="px-5 pb-4 space-y-3 animate-[fade-in_0.2s_ease-out]">
              {project.konflikte.map((k) => (
                <div key={k.id} className="rounded-lg border border-destructive/10 bg-destructive/5 p-4">
                  <p className="text-sm font-medium text-foreground/90 mb-2">{k.title}</p>
                  <p className="text-xs text-muted-foreground/70 mb-3">{k.beschreibung}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="text-xs px-3 py-2 rounded-md bg-background/40 border border-border/30">
                      <span className="text-muted-foreground/50 block mb-0.5">Fakt A</span>
                      <span className="text-foreground/80">{k.faktA}</span>
                    </div>
                    <div className="text-xs px-3 py-2 rounded-md bg-background/40 border border-border/30">
                      <span className="text-muted-foreground/50 block mb-0.5">Fakt B</span>
                      <span className="text-foreground/80">{k.faktB}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StatChip = ({ label, value, variant = "default" }: { label: string; value: string | number; variant?: "default" | "warning" | "neutral" }) => {
  const colors = {
    default: "bg-primary/10 text-primary/90 border-primary/15",
    warning: "bg-destructive/10 text-destructive/90 border-destructive/15",
    neutral: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs tracking-wide ${colors[variant]}`}>
      <span className="opacity-70">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
};

export default ProjectHeader;
