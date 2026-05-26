// =============================================================================
//  GlobalCommandMenu — ⌘/Ctrl+K Projekt-Picker, global auf jeder Route.
//  Ersetzt den vorherigen ProjectSwitcher-Pill im Project-Header.
// =============================================================================
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useProjects } from "@/lib/project/useProjects";

const GlobalCommandMenu = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { projects } = useProjects();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Projekt suchen…" />
      <CommandList>
        <CommandEmpty>Keine Projekte.</CommandEmpty>
        <CommandGroup heading="Projekte">
          {projects.map((p) => (
            <CommandItem
              key={p.id}
              value={p.name}
              onSelect={() => {
                setOpen(false);
                navigate(`/projekt/${p.id}`);
              }}
            >
              <span className="truncate">{p.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => {
              setOpen(false);
              navigate("/");
            }}
          >
            Startseite
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setOpen(false);
              navigate("/pipeline-health");
            }}
          >
            Pipeline Health
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalCommandMenu;
