import { Users } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { demoProject } from "@/data/demoProject";

type Stakeholder = (typeof demoProject)["stakeholder"][number];

const StakeholderPopover = ({ stakeholder }: { stakeholder: Stakeholder[] }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Users className="w-3.5 h-3.5 text-muted-foreground/60" />
          <span className="text-[11px] uppercase tracking-wider">Stakeholder</span>
          <span className="text-sm text-foreground/95 font-medium">{stakeholder.length}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 p-0 bg-surface-2 border-border-subtle shadow-card-glow"
      >
        <div className="px-4 py-3 border-b border-border-subtle">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70">
            Stakeholder · {stakeholder.length}
          </p>
        </div>
        <ul className="divide-y divide-border-subtle max-h-80 overflow-y-auto">
          {stakeholder.map((s) => (
            <li key={s.id} className="px-4 py-2.5">
              <p className="text-sm text-foreground/95">{s.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {s.rolle} · {s.org}
              </p>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
};

export default StakeholderPopover;
