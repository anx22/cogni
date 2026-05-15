import { useEffect, useRef } from "react";
import { Calendar, Clock, Target } from "lucide-react";
import { toast } from "sonner";
import ConflictBanner from "./shared/ConflictBanner";
import StakeholderPopover from "./shared/StakeholderPopover";
import FeedbackButton from "./shared/FeedbackButton";
import type { ProjectViewModel } from "@/lib/project/types";

type Project = ProjectViewModel;

interface LageZoneProps {
  project: Project;
  editableName?: boolean;
  forceEdit?: boolean;
  onEditDone?: () => void;
  onNameChange?: (name: string) => void;
}

const LageZone = ({ project, editableName, forceEdit, onEditDone, onNameChange }: LageZoneProps) => {
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  // forceEdit von außen → h1 fokussieren + Text selektieren.
  useEffect(() => {
    if (!forceEdit || !editableName) return;
    const el = titleRef.current;
    if (!el) return;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [forceEdit, editableName]);

  const handleNameBlur = (e: React.FocusEvent<HTMLHeadingElement>) => {
    const text = e.currentTarget.textContent?.trim() ?? "";
    if (!text) {
      // Empty → restore + warn
      e.currentTarget.textContent = project.name;
      toast.error("Name darf nicht leer sein");
    } else if (text !== project.name) {
      onNameChange?.(text);
    }
    onEditDone?.();
  };

  return (
    <section className="relative px-8 md:px-12 lg:px-16 xl:px-20 pt-16 pb-12 bg-surface-1 border-b border-border-strong">
      {/* Cogni Atmosphären-Stripe (3px Linie + 60px Glow) */}
      <div className="atmosphere-stripe" aria-hidden />

      {/* Subtle gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.06] via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto space-y-8">
        {/* Title row + meta strip directly underneath */}
        <div>
          <p className="t-micro ink-4 mb-3">Projekt</p>
          {editableName ? (
            <h1
              ref={titleRef}
              className="text-foreground mb-3 outline-none border-b border-dashed border-primary/30 focus:border-primary/60 transition-colors"
              style={{ fontSize: "44px", fontWeight: 500, letterSpacing: "-0.025em", lineHeight: 1.04 }}
              contentEditable
              spellCheck={false}
              suppressContentEditableWarning
              onBlur={handleNameBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); }
                if (e.key === "Escape") {
                  e.preventDefault();
                  e.currentTarget.textContent = project.name;
                  e.currentTarget.blur();
                }
              }}
            >
              {project.name}
            </h1>
          ) : (
            <h1
              className="text-foreground mb-3"
              style={{ fontSize: "44px", fontWeight: 500, letterSpacing: "-0.025em", lineHeight: 1.04 }}
            >
              {project.name}
            </h1>
          )}
          <p
            className="text-foreground/85 max-w-3xl mb-5"
            style={{ fontSize: "24px", fontWeight: 300, lineHeight: 1.4, letterSpacing: "-0.015em" }}
          >
            {project.lagetext}
          </p>
          {project.description && (
            <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed mb-5">
              {project.description}
            </p>
          )}

          {/* Meta strip */}
          <div className="flex flex-wrap items-end gap-x-8 gap-y-3 pt-3 border-t border-border-subtle/60">
            <MetaChip icon={<Calendar className="w-3.5 h-3.5" />} label="Nächster Termin" value={project.stats.naechsterTermin} />
            <MetaChip icon={<Clock className="w-3.5 h-3.5" />} label="Letzte Änderung" value={project.stats.letzteAenderung} />
            <StakeholderPopover stakeholder={project.stakeholder} />
            <MetaChip icon={<Target className="w-3.5 h-3.5" />} label="Budget" value={project.stats.budget} />
          </div>
        </div>

        {/* Konflikt + Zielbild (Lagebild-Card entfernt — Lagetext jetzt im Hero darüber) */}
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

        <div className="flex items-center justify-end">
          <FeedbackButton context="Lagebild" />
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
