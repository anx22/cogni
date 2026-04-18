import { useMemo, useState, useRef, useCallback, KeyboardEvent } from "react";
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

const COLS = 4;
const ROWS = 5;
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

  const items = projects ?? [];
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
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

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3",
        "animate-float-in",
        side === "left" ? "[animation-delay:200ms]" : "[animation-delay:350ms]",
        "opacity-0 [animation-fill-mode:forwards]",
        isDragActive && "pointer-events-none opacity-30 transition-opacity duration-300",
      )}
    >
      <div
        className={cn(
          "rounded-3xl p-6 backdrop-blur-sm",
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
            className="grid gap-x-3 gap-y-4"
            style={{
              gridTemplateColumns: `repeat(${COLS}, 3.5rem)`,
              gridTemplateRows: `repeat(${ROWS}, 4.5rem)`,
            }}
            aria-hidden
          />
        ) : isEmpty ? (
          <div
            className="grid gap-x-3 gap-y-4"
            style={{
              gridTemplateColumns: `repeat(${COLS}, 3.5rem)`,
              gridTemplateRows: `repeat(${ROWS}, 4.5rem)`,
            }}
          >
            <button
              onClick={onCreateProject}
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center",
                "bg-[hsl(var(--surface-2))] hover:bg-[hsl(var(--surface-3))]",
                "transition-all duration-300 hover:scale-105",
                "text-muted-foreground/50 hover:text-muted-foreground",
              )}
              aria-label="Erstes Projekt anlegen"
              title="Erstes Projekt anlegen"
            >
              <Plus size={18} strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <div
            className="grid gap-x-3 gap-y-4"
            style={{
              gridTemplateColumns: `repeat(${COLS}, 3.5rem)`,
            }}
          >
            {pageItems.map((p, idx) => (
              <ProjectTile
                key={p.id}
                ref={(el) => (tileRefs.current[idx] = el)}
                name={p.name}
                initial={p.initial}
                isActive={p.id === activeId}
                onClick={() => onProjectClick?.(p.id)}
                onKeyDown={handleKeyDown(idx)}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && !isPlaceholder && (
          <div className="flex items-center justify-center gap-1.5 mt-5" role="tablist">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === page}
                aria-label={`Seite ${i + 1}`}
                onClick={() => setPage(i)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  i === page ? "bg-foreground/60" : "bg-foreground/15 hover:bg-foreground/30",
                )}
              />
            ))}
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
