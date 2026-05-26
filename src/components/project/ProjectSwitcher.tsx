// =============================================================================
//  ProjectSwitcher — Combobox zum schnellen Wechsel zwischen Projekten.
//  Öffnet sich auch via ⌘/Ctrl+K, wenn `globalShortcut` aktiv ist.
// =============================================================================
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useProjects } from "@/lib/project/useProjects";
import { cn } from "@/lib/utils";

interface Props {
  currentId?: string | null;
  currentName?: string | null;
  globalShortcut?: boolean;
}

const ProjectSwitcher = ({ currentId, currentName, globalShortcut }: Props) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { projects } = useProjects();

  useEffect(() => {
    if (!globalShortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [globalShortcut]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs tracking-wide",
            "text-muted-foreground/80 hover:text-foreground hover:bg-surface-2/60 transition-colors",
            "border border-transparent hover:border-border-subtle",
          )}
          aria-label="Projekt wechseln"
        >
          <span className="truncate max-w-[20ch]">{currentName ?? "Projekt wählen"}</span>
          <ChevronsUpDown className="w-3 h-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-0 bg-[hsl(var(--surface-1))] border-border-subtle"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Projekt suchen…" className="h-9" />
          <CommandList>
            <CommandEmpty>Keine Projekte.</CommandEmpty>
            <CommandGroup>
              {projects.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.name}
                  onSelect={() => {
                    setOpen(false);
                    if (p.id !== currentId) navigate(`/projekt/${p.id}`);
                  }}
                >
                  <span className="truncate">{p.name}</span>
                  {p.id === currentId && (
                    <span className="ml-auto text-[10px] text-muted-foreground/60 tracking-wide">
                      aktuell
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ProjectSwitcher;
