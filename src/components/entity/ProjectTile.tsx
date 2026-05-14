import { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/format/relativeTime";
import type { ProjectSignal } from "@/data/demoProjects";
import HoverActionsMenu from "@/components/shared/HoverActionsMenu";
import ConfirmDestructive from "@/components/shared/ConfirmDestructive";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useProjectActions } from "@/lib/object-actions/useObjectActions";

interface ProjectTileProps {
  id?: string;
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
  archived?: boolean;
  onChanged?: () => void;
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
      id,
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
      archived,
      onChanged,
    },
    ref,
  ) => {
    const signals = orderedSignals(signal, signal2);
    const time = formatRelative(lastChangedAt);
    const meta = [time, openCount ? `${openCount} offen` : null]
      .filter(Boolean)
      .join(" · ");

    const [renaming, setRenaming] = useState(false);
    const [draftName, setDraftName] = useState(name);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const actions = useProjectActions();

    return (
      <div className="group relative">
        <button
          ref={ref}
          onClick={onClick}
          onKeyDown={onKeyDown}
          tabIndex={tabIndex ?? 0}
          title={name}
          aria-label={name}
          className={cn(
            "relative w-[140px] h-[72px] rounded-2xl px-3 py-2.5",
            "flex items-center gap-3 text-left",
            "bg-[hsl(var(--surface-2))] hover:bg-[hsl(var(--surface-3))]",
            "transition-all duration-300 ease-out hover:-translate-y-0.5",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_-4px_rgba(0,0,0,0.4)]",
            "focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
            isActive && "ring-1 ring-primary/40 bg-[hsl(var(--surface-3))]",
            archived && "opacity-60",
          )}
        >
          {renaming ? (
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={async () => {
                if (id && draftName.trim() && draftName !== name) {
                  await actions.rename(id, draftName);
                  onChanged?.();
                }
                setRenaming(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") {
                  setDraftName(name);
                  setRenaming(false);
                }
              }}
              className="bg-transparent text-[13px] font-medium text-foreground outline-none border-b border-primary/40 flex-1 min-w-0"
            />
          ) : (
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
          )}

          {signals.length > 0 && !renaming && (
            <span className="absolute top-2 right-2 flex items-center gap-1">
              {signals.map((s) => (
                <span
                  key={s}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    signalColor(s),
                    s !== "calm" && "group-hover:animate-pulse",
                  )}
                  aria-hidden
                />
              ))}
            </span>
          )}
        </button>

        {/* Actions dot in bottom-right (less crowded than top-right) */}
        {id && !renaming && (
          <div className="absolute bottom-1 right-1">
            <HoverActionsMenu label={`Aktionen für ${name}`}>
              {archived ? (
                <DropdownMenuItem onClick={async () => {
                  await actions.unarchive(id);
                  onChanged?.();
                }}>Wiederherstellen</DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => { setDraftName(name); setRenaming(true); }}>
                    Umbenennen
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => {
                    await actions.archive(id);
                    onChanged?.();
                  }}>
                    Archivieren
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-rose-400 focus:text-rose-300"
                onClick={() => setConfirmDelete(true)}
              >
                Löschen…
              </DropdownMenuItem>
            </HoverActionsMenu>
          </div>
        )}

        {id && (
          <ConfirmDestructive
            open={confirmDelete}
            onOpenChange={setConfirmDelete}
            title={`„${name}" löschen?`}
            description="Das Projekt und alle zugehörigen Inputs, Fakten, Verläufe und Konflikte werden unwiderruflich entfernt. Wenn du dir nicht sicher bist, archiviere stattdessen."
            onConfirm={async () => {
              await actions.remove(id);
              onChanged?.();
            }}
          />
        )}
      </div>
    );
  },
);
ProjectTile.displayName = "ProjectTile";

export default ProjectTile;
