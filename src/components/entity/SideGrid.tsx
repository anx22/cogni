import { useMemo, useState, useRef, useCallback, useEffect, KeyboardEvent } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import ProjectTile from "./ProjectTile";
import type { DemoProject } from "@/data/demoProjects";

interface SideGridProps {
  side: "left" | "right";
  label?: string;
  projects?: DemoProject[];
  activeId?: string;
  onProjectClick?: (id: string) => void;
  onCreateProject?: () => void;
  isDragActive?: boolean;
}

const COLS = 2;
const ROWS = 4;
const PAGE_SIZE = COLS * ROWS;

const SideGrid = ({
  side,
  label,
  projects,
  activeId,
  onProjectClick,
  onCreateProject,
  isDragActive,
}: SideGridProps) => {
  const [page, setPage] = useState(0);
  const tileRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const items = useMemo(() => {
    const list = projects ?? [];
    return [...list].sort((a, b) => {
      const ta = a.lastChangedAt ? new Date(a.lastChangedAt).getTime() : 0;
      const tb = b.lastChangedAt ? new Date(b.lastChangedAt).getTime() : 0;
      return tb - ta;
    });
  }, [projects]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  // Wenn die aktuelle Seite nach Löschungen leer wäre, springen wir zurück.
  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const pageItems = useMemo(
    () => items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [items, page],
  );

  const handleKeyDown = useCallback(
    (idx: number) => (e: KeyboardEvent) => {
      let next = idx;
      if (e.key === "ArrowRight") next = idx + 1;
      else if (e.key === "ArrowLeft") next = idx - 1;
      else if (e.key === "ArrowDown") next = idx + COLS;
      else if (e.key === "ArrowUp") next = idx - COLS;
      else return;
      e.preventDefault();
      const target = tileRefs.current[next];
      if (target) target.focus();
    },
    [],
  );

  const isEmpty = side === "left" && items.length === 0;
  const isPlaceholder = side === "right";
  const showPaginationDots = !isPlaceholder;
  const showAddTile = side === "left" && pageItems.length < PAGE_SIZE && pageItems.length > 0;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3",
        "animate-float-in",
        side === "left" ? "[animation-delay:200ms]" : "[animation-delay:350ms]",
        "opacity-0 [animation-fill-mode:forwards]",
      )}
    >
      <div
        className={cn(
          "rounded-3xl p-7 backdrop-blur-sm",
          "bg-[hsl(var(--surface-1)/0.3)]",
        )}
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--foreground) / 0.08) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      >
        {isPlaceholder ? (
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${COLS}, 140px)`,
              gridTemplateRows: `repeat(${ROWS}, 72px)`,
              columnGap: "10px",
              rowGap: "12px",
            }}
            aria-hidden
          />
        ) : isEmpty ? (
          <button
            onClick={onCreateProject}
            className={cn(
              "rounded-2xl flex items-center justify-center gap-2",
              "bg-[hsl(var(--surface-2))] hover:bg-[hsl(var(--surface-3))]",
              "transition-all duration-300 hover:scale-[1.02]",
              "text-muted-foreground/60 hover:text-muted-foreground",
              "h-[72px]",
            )}
            style={{ width: `${COLS * 140 + (COLS - 1) * 10}px` }}
            aria-label="Erstes Projekt anlegen"
            title="Erstes Projekt anlegen"
          >
            <Plus size={16} strokeWidth={1.5} />
            <span className="text-xs tracking-wide">Erstes Projekt anlegen</span>
          </button>
        ) : (
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${COLS}, 140px)`,
              gridTemplateRows: `repeat(${ROWS}, 72px)`,
              columnGap: "10px",
              rowGap: "12px",
            }}
          >
            {pageItems.map((p, idx) => (
              <ProjectTile
                key={p.id}
                ref={(el) => (tileRefs.current[idx] = el)}
                id={p.id}
                name={p.name}
                initial={p.initial}
                isActive={p.id === activeId}
                lastChangedAt={p.lastChangedAt}
                openCount={p.openCount}
                signal={p.signal}
                signal2={p.signal2}
                onClick={() => onProjectClick?.(p.id)}
                onKeyDown={handleKeyDown(idx)}
              />
            ))}
            {showAddTile && (
              <button
                onClick={onCreateProject}
                className={cn(
                  "rounded-2xl flex items-center justify-center gap-2",
                  "bg-[hsl(var(--surface-2)/0.5)] hover:bg-[hsl(var(--surface-3))]",
                  "transition-all duration-300 hover:scale-[1.02]",
                  "text-muted-foreground/40 hover:text-muted-foreground/70",
                  "border border-dashed border-border/20 hover:border-border/40",
                )}
                aria-label="Neues Projekt anlegen"
                title="Neues Projekt anlegen"
              >
                <Plus size={14} strokeWidth={1.5} />
              </button>
            )}
          </div>
        )}

        {showPaginationDots && (
          <div className="flex items-center justify-between mt-5">
            <button
              onClick={onCreateProject}
              className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors tracking-wide"
            >
              + Neues Projekt
            </button>
            <div className="flex items-center gap-1.5" role="tablist">
              {Array.from({ length: Math.max(totalPages, 1) }).map((_, i) => {
                const single = totalPages <= 1;
                return (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={i === page}
                    aria-label={`Seite ${i + 1}`}
                    onClick={() => !single && setPage(i)}
                    disabled={single}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-colors",
                      single
                        ? "bg-foreground/10 cursor-default"
                        : i === page
                          ? "bg-foreground/60"
                          : "bg-foreground/15 hover:bg-foreground/30",
                    )}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {label && (
        <span className="text-[10px] tracking-widest uppercase text-muted-foreground/40">
          {label}
        </span>
      )}
    </div>
  );
};

export default SideGrid;
