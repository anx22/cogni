import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface BentoCardProps {
  title: string;
  icon?: ReactNode;
  badge?: string | number;
  badgeVariant?: "default" | "warning" | "success";
  children: ReactNode;
  expandable?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

const BentoCard = ({
  title,
  icon,
  badge,
  badgeVariant = "default",
  children,
  expandable = false,
  defaultExpanded = true,
  className = "",
}: BentoCardProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const badgeColors = {
    default: "bg-primary/15 text-primary/90",
    warning: "bg-destructive/15 text-destructive/90",
    success: "bg-emerald-500/15 text-emerald-400/90",
  };

  return (
    <div
      className={`rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-border/90 hover:bg-card/80 ${className}`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-6 py-4 ${expandable ? "cursor-pointer select-none" : ""}`}
        onClick={expandable ? () => setExpanded(!expanded) : undefined}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-muted-foreground/60">{icon}</span>}
          <h2 className="text-sm font-medium tracking-wide text-foreground/90 uppercase">
            {title}
          </h2>
          {badge !== undefined && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColors[badgeVariant]}`}>
              {badge}
            </span>
          )}
        </div>
        {expandable && (
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground/40 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
          />
        )}
      </div>

      {/* Content */}
      {(!expandable || expanded) && (
        <div className="px-6 pb-5 animate-[fade-in_0.2s_ease-out]">
          {children}
        </div>
      )}
    </div>
  );
};

export default BentoCard;
