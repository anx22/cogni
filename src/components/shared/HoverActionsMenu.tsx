import { MoreHorizontal } from "lucide-react";
import { type ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface HoverActionsMenuProps {
  children: ReactNode;
  className?: string;
  /** When true, the trigger dot is always visible (e.g. when menu is open). */
  forceVisible?: boolean;
  /** Stop drag/click propagation on the trigger. */
  label?: string;
}

const HoverActionsMenu = ({
  children,
  className,
  forceVisible,
  label = "Aktionen",
}: HoverActionsMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex items-center justify-center w-6 h-6 rounded-full",
            "text-muted-foreground/60 hover:text-foreground hover:bg-foreground/10",
            "transition-opacity duration-150",
            forceVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100",
            className,
          )}
        >
          <MoreHorizontal className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[180px]"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default HoverActionsMenu;
