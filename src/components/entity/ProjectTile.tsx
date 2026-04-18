import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ProjectTileProps {
  name: string;
  initial: string;
  isActive?: boolean;
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  tabIndex?: number;
}

const ProjectTile = forwardRef<HTMLButtonElement, ProjectTileProps>(
  ({ name, initial, isActive, onClick, onKeyDown, tabIndex }, ref) => {
    return (
      <div className="flex flex-col items-center gap-1.5 group">
        <button
          ref={ref}
          onClick={onClick}
          onKeyDown={onKeyDown}
          tabIndex={tabIndex ?? 0}
          title={name}
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center",
            "bg-[hsl(var(--surface-2))] hover:bg-[hsl(var(--surface-3))]",
            "transition-all duration-300 ease-out",
            "hover:scale-105 active:scale-95",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_-4px_rgba(0,0,0,0.4)]",
            "focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
          )}
          aria-label={name}
        >
          <span className="text-[11px] font-medium tracking-wide text-primary/80 group-hover:text-primary transition-colors">
            {initial}
          </span>
        </button>
        <div className="flex flex-col items-center gap-0.5 w-16">
          <span className="text-[10px] text-muted-foreground/70 group-hover:text-muted-foreground truncate max-w-full transition-colors">
            {name}
          </span>
          {isActive && (
            <span className="w-1 h-1 rounded-full bg-foreground/50" aria-hidden />
          )}
        </div>
      </div>
    );
  },
);
ProjectTile.displayName = "ProjectTile";

export default ProjectTile;
