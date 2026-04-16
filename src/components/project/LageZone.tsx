import { Calendar, Clock, Users, Target } from "lucide-react";
import ConflictBanner from "./shared/ConflictBanner";
import type { demoProject } from "@/data/demoProject";

type Project = typeof demoProject;

const LageZone = ({ project }: { project: Project }) => {
  return (
    <section className="relative px-8 md:px-12 lg:px-16 xl:px-20 pt-16 pb-10 border-b border-border/40">
      {/* Subtle gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-6xl mx-auto space-y-7">
        {/* Title row */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-3">Projekt</p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground/95 mb-3">
            {project.name}
          </h1>
          <p className="text-sm text-muted-foreground/70 max-w-3xl leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Lagetext — the situation report */}
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2.5">Lagebild</p>
          <p className="text-base text-foreground/85 leading-relaxed">{project.lagetext}</p>
        </div>

        {/* Conflict banner */}
        <ConflictBanner konflikte={project.konflikte} />

        {/* Meta strip */}
        <div className="flex flex-wrap gap-x-8 gap-y-3 pt-1">
          <MetaChip icon={<Calendar className="w-3.5 h-3.5" />} label="Nächster Termin" value={project.stats.naechsterTermin} />
          <MetaChip icon={<Clock className="w-3.5 h-3.5" />} label="Letzte Änderung" value={project.stats.letzteAenderung} />
          <MetaChip icon={<Users className="w-3.5 h-3.5" />} label="Stakeholder" value={`${project.stats.stakeholder}`} />
          <MetaChip icon={<Target className="w-3.5 h-3.5" />} label="Budget" value={project.stats.budget} />
        </div>

        {/* Outcome / Zielbild */}
        {project.outcome && (
          <div className="rounded-xl border border-border/40 bg-card/30 px-5 py-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">Zielbild</p>
            <p className="text-sm text-foreground/80 leading-relaxed mb-2">{project.outcome.erfolgskriterium}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {project.outcome.nogos.map((n, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-destructive/10 text-destructive/80 border border-destructive/20">
                  No-Go: {n}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const MetaChip = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-2 text-muted-foreground/60">
    <span className="text-muted-foreground/40">{icon}</span>
    <span className="text-[11px] uppercase tracking-wider">{label}</span>
    <span className="text-sm text-foreground/85 font-medium">{value}</span>
  </div>
);

export default LageZone;
