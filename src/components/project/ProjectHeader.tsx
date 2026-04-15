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
  };
}

const ProjectHeader = ({ project }: ProjectHeaderProps) => {
  return (
    <div className="pt-16 pb-10 px-8 md:px-12 lg:px-16 xl:px-20">
      {/* Project name */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-foreground mb-6">
        {project.name}
      </h1>

      {/* Lage summary text */}
      <p className="text-base md:text-lg text-muted-foreground/80 max-w-3xl leading-relaxed mb-8">
        {project.lagetext}
      </p>

      {/* Compact stat chips */}
      <div className="flex flex-wrap gap-3">
        <StatChip label="Konflikte" value={project.stats.konflikte} variant="warning" />
        <StatChip label="Offene Punkte" value={project.stats.offenePunkte} />
        <StatChip label="Entscheidungen offen" value={project.stats.entscheidungenOffen} />
        <StatChip label="Letzte Änderung" value={project.stats.letzteAenderung} variant="neutral" />
        <StatChip label="Nächster Termin" value={project.stats.naechsterTermin} variant="neutral" />
      </div>
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
