import { Calendar, Clock, Target } from "lucide-react";
import ConflictBanner from "./shared/ConflictBanner";
import StakeholderPopover from "./shared/StakeholderPopover";
import FeedbackButton from "./shared/FeedbackButton";
import type { ProjectViewModel } from "@/lib/project/types";

type Project = ProjectViewModel;

const LageZone = ({ project }: { project: Project }) => {
  return (
    <section className="relative px-8 md:px-12 lg:px-16 xl:px-20 pt-16 pb-12 bg-surface-1 border-b border-border-strong">
      {/* Subtle gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.06] via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto space-y-8">
        {/* Title row + meta strip directly underneath */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-3">Projekt</p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-3">
            {project.name}
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed mb-5">
            {project.description}
          </p>

          {/* Meta strip */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-3 border-t border-border-subtle/60">
            <MetaChip icon={<Calendar className="w-3.5 h-3.5" />} label="Nächster Termin" value={project.stats.naechsterTermin} />
            <MetaChip icon={<Clock className="w-3.5 h-3.5" />} label="Letzte Änderung" value={project.stats.letzteAenderung} />
            <StakeholderPopover stakeholder={project.stakeholder} />
            <MetaChip icon={<Target className="w-3.5 h-3.5" />} label="Budget" value={project.stats.budget} />
          </div>
        </div>

        {/* Lagebild — Hero, dominant */}
        <div className="group relative rounded-2xl border border-border-subtle bg-surface-2 shadow-card-glow p-8 overflow-hidden">
          <span className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-primary/50" />
          <div className="flex items-start justify-between gap-4 mb-3 pl-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-primary/80">Lagebild</p>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <FeedbackButton context="Lagebild" />
            </div>
          </div>
          <p className="text-lg md:text-xl text-foreground leading-relaxed pl-3 font-light">
            {project.lagetext}
          </p>
        </div>

        {/* Konflikt + Zielbild */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <ConflictBanner konflikte={project.konflikte} />
          </div>

          {project.outcome && (
            <div className="rounded-xl border border-border-subtle bg-surface-2 shadow-card-glow px-5 py-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">Zielbild</p>
              <p className="text-sm text-foreground/90 leading-relaxed mb-2.5">{project.outcome.erfolgskriterium}</p>
              <div className="flex flex-wrap gap-1.5">
                {project.outcome.nogos.map((n, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-destructive/15 text-destructive border border-destructive/40">
                    No-Go: {n}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

const MetaChip = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-2 text-muted-foreground">
    <span className="text-muted-foreground/60">{icon}</span>
    <span className="text-[11px] uppercase tracking-wider">{label}</span>
    <span className="text-sm text-foreground/95 font-medium">{value}</span>
  </div>
);

export default LageZone;
