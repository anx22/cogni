import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/format/relativeTime";
import type { ProjectSignal } from "@/data/demoProjects";

interface ProjectTileProps {
  name: string;
  initial: string;
  isActive?: boolean;
  lastChangedAt?: string;
  openCount?: number;
  signal?: ProjectSignal;
  signal2?: ProjectSignal;
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  tabIndex?: number;
}

const SIGNAL_PRIORITY: ProjectSignal[] = ["conflict", "review", "action", "calm"];

const signalColor = (s: ProjectSignal): string => {
  switch (s) {
    case "conflict":
      return "bg-rose-400";
    case "review":
      return "bg-emerald-400";
    case "action":
      return "bg-amber-400";
    case "calm":
    default:
      return "bg-foreground/25";
  }
};

const orderedSignals = (a?: ProjectSignal, b?: ProjectSignal): ProjectSignal[] => {
  const set = new Set<ProjectSignal>();
  [a, b].forEach((s) => s && set.add(s));
  return SIGNAL_PRIORITY.filter((s) => set.has(s)).slice(0, 2);
};

const ProjectTile = forwardRef<HTMLButtonElement, ProjectTileProps>(
  (
    {
      name,
      initial,
      isActive,
      lastChangedAt,
      openCount,
      signal,
      signal2,
      onClick,
      onKeyDown,
      tabIndex,
    },
    ref,
  ) => {
    const signals = orderedSignals(signal, signal2);
    const time = formatRelative(lastChangedAt);
    const meta = [time, openCount ? `${openCount} offen` : null]
      .filter(Boolean)
      .join(" · ");

    return (
      <button
        ref={ref}
        onClick={onClick}
        onKeyDown={onKeyDown}
        tabIndex={tabIndex ?? 0}
        title={name}
        aria-label={name}
        className={cn(
          "group relative w-[140px] h-[72px] rounded-2xl px-3 py-2.5",
          "flex items-center gap-3 text-left",
          "bg-[hsl(var(--surface-2))] hover:bg-[hsl(var(--surface-3))]",
          "transition-all duration-300 ease-out hover:-translate-y-0.5",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_-4px_rgba(0,0,0,0.4)]",
          "focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
          isActive && "ring-1 ring-primary/40 bg-[hsl(var(--surface-3))]",
        )}
      >
        {/* Initial chip */}
        <span
          className={cn(
            "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center",
            "bg-[hsl(var(--surface-1))]",
            "text-[10px] font-medium tracking-wide text-primary/80",
            "group-hover:text-primary transition-colors",
          )}
          aria-hidden
        >
          {initial}
        </span>

        {/* Title + meta */}
        <span className="flex flex-col min-w-0 flex-1 gap-0.5">
          <span className="text-[13px] font-medium text-foreground/90 truncate leading-tight">
            {name}
          </span>
          {meta && (
            <span className="text-[10px] text-muted-foreground/60 truncate leading-tight">
              {meta}
            </span>
          )}
        </span>

      </button>
    );
  },
);
ProjectTile.displayName = "ProjectTile";

export default ProjectTile;
