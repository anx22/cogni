import { useEffect, useRef } from "react";
import { Flag, Upload, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import StakeholderPopover from "./shared/StakeholderPopover";
import type { ProjectViewModel } from "@/lib/project/types";

type Project = ProjectViewModel;

interface LageZoneProps {
  project: Project;
  editableName?: boolean;
  forceEdit?: boolean;
  onEditDone?: () => void;
  onNameChange?: (name: string) => void;
  variant?: "full" | "shell";
}

// "15. Mai · Steering-Termin" → { date: "15. Mai", topic: "Steering-Termin" }
function splitTermin(s: string | undefined | null): { date: string; topic: string | null } {
  if (!s) return { date: "—", topic: null };
  const [date, ...rest] = s.split("·").map((x) => x.trim());
  return { date: date || s, topic: rest.length ? rest.join(" · ") : null };
}

function initialsFromName(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "·"
  );
}

const LageZone = ({
  project,
  editableName,
  forceEdit,
  onEditDone,
  onNameChange,
  variant = "full",
}: LageZoneProps) => {
  const titleRef = useRef<HTMLHeadingElement | null>(null);

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
      e.currentTarget.textContent = project.name;
      toast.error("Name darf nicht leer sein");
    } else if (text !== project.name) {
      onNameChange?.(text);
    }
    onEditDone?.();
  };

  const titleNode = editableName ? (
    <h1
      ref={titleRef}
      className="text-foreground outline-none border-b border-dashed border-primary/30 focus:border-primary/60 transition-colors"
      style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.04, margin: 0 }}
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
      className="text-foreground"
      style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.04, margin: 0 }}
    >
      {project.name}
    </h1>
  );

  if (variant === "shell") {
    return (
      <section className="relative px-8 md:px-12 lg:px-16 xl:px-20 pt-20 pb-32 bg-surface-1">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <p className="t-micro ink-4 mb-3">Projekt</p>
          {titleNode}
          <p className="text-base text-foreground/70 font-light leading-relaxed mt-6 max-w-xl mx-auto">
            Noch keine Substanz. Lege etwas ab — eine Datei, einen Link, eine Notiz —
            ich beginne mit dem Verstehen.
          </p>
        </div>
      </section>
    );
  }

  // ---- Hero ----
  const initials = initialsFromName(project.name);
  const konfliktCount = project.konflikte.length;
  const blockerCount = project.handlungsbedarf.filter((h) => h.blocker).length;
  const handlungCount = project.handlungsbedarf.length;
  const termin = splitTermin(project.stats.naechsterTermin);

  return (
    <section
      className="relative bg-surface-1 border-b border-border-strong"
      style={{ padding: "44px 56px 36px" }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.06] via-transparent to-transparent pointer-events-none" />

      <div className="relative">
        {/* Breadcrumb + Header-Actions */}
        <div
          className="flex items-center justify-between gap-4"
          style={{ marginBottom: 24 }}
        >
          <div
            className="flex items-center"
            style={{ gap: 12, fontSize: 12.5, color: "var(--ink-3)" }}
          >
            <span
              className="mono inline-flex items-center justify-center shrink-0"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "var(--surface-2)",
                color: "var(--ink-2)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "-.01em",
              }}
              aria-hidden
            >
              {initials}
            </span>
            <span style={{ color: "var(--ink-4)" }}>·</span>
            <StakeholderPopover stakeholder={project.stakeholder} />
            {project.stats.budget && project.stats.budget !== "—" && (
              <>
                <span style={{ color: "var(--ink-4)" }}>·</span>
                <span className="mono tabular">{project.stats.budget}</span>
              </>
            )}
          </div>

          <div className="flex shrink-0" style={{ gap: 8 }}>
            <button
              type="button"
              className="inline-flex items-center gap-2"
              style={{
                height: 32,
                padding: "0 12px",
                borderRadius: 10,
                background: "transparent",
                border: "1px solid var(--hair-2, var(--hair))",
                color: "var(--ink-2)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <Upload className="w-3.5 h-3.5" />
              Material
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2"
              style={{
                height: 32,
                padding: "0 14px",
                borderRadius: 10,
                background: "var(--ink)",
                color: "var(--surface-0)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                border: "none",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Review öffnen
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Eyebrow */}
        <div className="t-micro" style={{ color: "var(--ink-3)", marginBottom: 14 }}>
          Lage
          <span
            style={{
              color: "var(--ink-4)",
              textTransform: "none",
              letterSpacing: 0,
              marginLeft: 6,
              fontWeight: 400,
            }}
          >
            · rekonstruiert vor 2 Min
          </span>
        </div>

        {titleNode}

        <p
          style={{
            margin: "20px 0 0",
            maxWidth: 880,
            fontSize: 24,
            fontWeight: 300,
            lineHeight: 1.35,
            letterSpacing: "-0.018em",
            color: "var(--ink)",
          }}
        >
          {project.lagetext}
        </p>

        {/* Chips inline + Key-Facts rechts */}
        <div
          className="flex items-end flex-wrap"
          style={{ gap: 10, marginTop: 26 }}
        >
          {konfliktCount > 0 && (
            <span className="chip-pill" data-tone="conflict">
              Konflikt {konfliktCount}
            </span>
          )}
          {blockerCount > 0 && (
            <span className="chip-pill" data-tone="review">
              {blockerCount} Blocker
            </span>
          )}
          {handlungCount > 0 && (
            <span className="chip-pill" data-tone="neutral">
              {handlungCount} offen
            </span>
          )}
          {konfliktCount === 0 && blockerCount === 0 && (
            <span className="chip-pill" data-tone="ok">on track</span>
          )}

          <div style={{ flex: 1 }} />

          <div className="flex" style={{ gap: 28, fontSize: 12.5, color: "var(--ink-3)" }}>
            <div>
              <div className="t-micro" style={{ marginBottom: 4 }}>Nächster Termin</div>
              <div className="flex items-baseline" style={{ gap: 6, color: "var(--ink)" }}>
                <span
                  className="mono tabular"
                  style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-.02em" }}
                >
                  {termin.date}
                </span>
                {termin.topic && (
                  <span style={{ color: "var(--ink-3)", fontSize: 13 }}>{termin.topic}</span>
                )}
              </div>
            </div>
            <div>
              <div className="t-micro" style={{ marginBottom: 4 }}>Letzte Änderung</div>
              <div className="mono" style={{ fontSize: 13, color: "var(--ink-2)" }}>
                {project.stats.letzteAenderung}
              </div>
            </div>
          </div>
        </div>

        {/* Outcome-Bar */}
        {project.outcome && (
          <div
            className="flex items-center flex-wrap"
            style={{
              marginTop: 22,
              padding: "10px 14px",
              borderRadius: 10,
              background: "var(--surface-2)",
              border: "1px solid var(--hair)",
              gap: 10,
              fontSize: 13,
              color: "var(--ink-2)",
            }}
          >
            <Flag className="w-3.5 h-3.5" style={{ color: "var(--ink-3)" }} />
            <span className="t-micro" style={{ color: "var(--ink-3)" }}>Outcome</span>
            <span style={{ color: "var(--ink)" }}>{project.outcome.erfolgskriterium}</span>
            {project.outcome.nogos.length > 0 && (
              <span className="flex items-center" style={{ gap: 6, marginLeft: "auto" }}>
                {project.outcome.nogos.map((n, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 10.5,
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "var(--sig-conflict-soft)",
                      color: "var(--sig-conflict)",
                      border: "1px solid var(--sig-conflict)",
                    }}
                  >
                    No-Go: {n}
                  </span>
                ))}
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default LageZone;
