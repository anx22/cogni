// =============================================================================
//  GlobalCommandMenu — ⌘/Ctrl+K. Projektübergreifende Suche + Navigation.
//  Projekte werden clientseitig gefiltert, Substanz-Treffer (Entscheidungen,
//  Themen, Aufgaben, offene Punkte) serverseitig via useGlobalSearch.
// =============================================================================
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GitBranch, Hash, CheckSquare, HelpCircle, Folder } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useProjects } from "@/lib/project/useProjects";
import { useGlobalSearch, type SearchKind } from "@/lib/search/useGlobalSearch";

const KIND_META: Record<SearchKind, { label: string; Icon: typeof GitBranch }> = {
  decision: { label: "Entscheidungen", Icon: GitBranch },
  topic: { label: "Themen", Icon: Hash },
  task: { label: "Aufgaben", Icon: CheckSquare },
  open_point: { label: "Offene Punkte", Icon: HelpCircle },
};

const KIND_ORDER: SearchKind[] = ["decision", "topic", "task", "open_point"];

const GlobalCommandMenu = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { results, loading } = useGlobalSearch(query, open);

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

  // Beim Schließen Query zurücksetzen, damit das Menü frisch öffnet.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const q = query.trim().toLowerCase();
  const filteredProjects = useMemo(
    () => (q ? projects.filter((p) => p.name.toLowerCase().includes(q)) : projects),
    [projects, q],
  );

  const grouped = useMemo(() => {
    const m = new Map<SearchKind, typeof results>();
    for (const kind of KIND_ORDER) m.set(kind, []);
    results.forEach((r) => m.get(r.kind)?.push(r));
    return m;
  }, [results]);

  const hasResults = filteredProjects.length > 0 || results.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command
          shouldFilter={false}
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
        >
          <CommandInput
            placeholder="Suchen — Projekte, Entscheidungen, Themen, Aufgaben…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Suche…" : q ? "Nichts gefunden." : "Tippen zum Suchen."}
            </CommandEmpty>

            {filteredProjects.length > 0 && (
              <CommandGroup heading="Projekte">
                {filteredProjects.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={`project-${p.id}`}
                    onSelect={() => go(`/projekt/${p.id}`)}
                  >
                    <Folder className="mr-2 text-muted-foreground" />
                    <span className="truncate">{p.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {KIND_ORDER.map((kind) => {
              const hits = grouped.get(kind) ?? [];
              if (hits.length === 0) return null;
              const { label, Icon } = KIND_META[kind];
              return (
                <CommandGroup key={kind} heading={label}>
                  {hits.map((h) => (
                    <CommandItem
                      key={`${kind}-${h.id}`}
                      value={`${kind}-${h.id}`}
                      onSelect={() => go(`/projekt/${h.projectId}`)}
                    >
                      <Icon className="mr-2 text-muted-foreground" />
                      <span className="truncate flex-1">{h.title}</span>
                      <span className="ml-2 shrink-0 text-xs text-muted-foreground truncate max-w-[40%]">
                        {h.projectName}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}

            {!q && (
              <CommandGroup heading="Navigation">
                <CommandItem value="nav-home" onSelect={() => go("/")}>
                  Startseite
                </CommandItem>
                <CommandItem value="nav-pipeline" onSelect={() => go("/pipeline-health")}>
                  Pipeline Health
                </CommandItem>
              </CommandGroup>
            )}

            {/* Verhindert „leeres" Flackern, solange Treffer eintreffen */}
            {!hasResults && q && !loading && <div className="py-2" />}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalCommandMenu;
