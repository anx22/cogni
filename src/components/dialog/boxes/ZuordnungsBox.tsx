import { useMemo, useState } from "react";
import { Check, FolderOpen, Search, Sparkles, Plus } from "lucide-react";
import { useDialog } from "../DialogProvider";
import BoxFrame, { ActionBtn } from "../BoxFrame";
import type { DialogBox } from "@/lib/dialog/types";

interface ProjectLite {
  project_id: string;
  name: string;
  score?: number;
  reasons?: string[];
}

type Selection = { kind: "existing"; projectId: string } | { kind: "new" };

const ZuordnungsBox = ({ box }: { box: DialogBox }) => {
  const { commitBox, readonly } = useDialog();

  const candidates: ProjectLite[] = useMemo(() => box.payload?.candidates ?? [], [box.payload]);
  const allProjects: ProjectLite[] = useMemo(() => box.payload?.all_projects ?? [], [box.payload]);
  const recommendedId: string | null = box.payload?.recommended_project_id ?? null;
  const suggestedNewName: string = box.payload?.suggested_new_name ?? "";
  const agentReason: string | undefined = box.payload?.agent_reason ?? undefined;

  // Empfehlung = recommendedId, sonst erster Kandidat (falls vorhanden)
  const recommended: ProjectLite | null = useMemo(() => {
    const id = recommendedId ?? candidates[0]?.project_id ?? null;
    if (!id) return null;
    return (
      candidates.find((c) => c.project_id === id) ??
      allProjects.find((p) => p.project_id === id) ??
      null
    );
  }, [recommendedId, candidates, allProjects]);

  // Initiale Auswahl: Empfehlung > kein bestehendes vorhanden → neu
  const initial: Selection = recommended
    ? { kind: "existing", projectId: recommended.project_id }
    : allProjects.length === 0
      ? { kind: "new" }
      : { kind: "existing", projectId: allProjects[0].project_id };
  const [sel, setSel] = useState<Selection>(initial);
  const [newName, setNewName] = useState<string>(suggestedNewName);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = allProjects;
    if (!q) return list;
    return list.filter((p) => p.name.toLowerCase().includes(q));
  }, [allProjects, query]);

  const newNameValid = newName.trim().length >= 2;
  const canConfirm =
    sel.kind === "new" ? newNameValid : !!sel.projectId;

  const confirm = () => {
    if (!canConfirm) return;
    if (sel.kind === "new") {
      commitBox(box.id, "confirm", { new_project_name: newName.trim() });
    } else {
      commitBox(box.id, "confirm", { project_id: sel.projectId });
    }
  };

  const actionLabel =
    sel.kind === "new" ? "Neues Projekt anlegen" : "Projekt übernehmen";

  return (
    <BoxFrame
      box={box}
      ignoreGate
      actions={
        <ActionBtn
          variant="primary"
          icon={<Check className="w-4 h-4" />}
          onClick={confirm}
          disabled={!canConfirm}
        >
          {actionLabel}
        </ActionBtn>
      }
    >
      {/* Empfehlung */}
      {recommended && (
        <div
          className={`rounded-xl p-5 transition-colors ${
            sel.kind === "existing" && sel.projectId === recommended.project_id
              ? "bg-primary/10 border border-primary/40"
              : "bg-surface-2/40 border border-border-subtle"
          }`}
        >
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-primary/80 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Empfehlung</span>
          </div>
          <button
            type="button"
            disabled={readonly}
            onClick={() =>
              setSel({ kind: "existing", projectId: recommended.project_id })
            }
            className="block w-full text-left"
          >
            <div className="text-xl font-light text-foreground/95">
              {recommended.name}
            </div>
            {agentReason && (
              <p className="mt-2 text-sm text-muted-foreground/80 leading-relaxed">
                {agentReason}
              </p>
            )}
          </button>
        </div>
      )}

      {/* Bestehende Projekte */}
      {allProjects.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground/60">
              Bestehende Projekte
            </p>
            {allProjects.length > 6 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted-foreground/50 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Suchen…"
                  className="pl-7 pr-2 py-1 text-sm bg-transparent border-b border-border-subtle focus:outline-none focus:border-primary/60 text-foreground/90 placeholder:text-muted-foreground/40 w-40"
                />
              </div>
            )}
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {filtered.map((p) => {
              const active =
                sel.kind === "existing" && sel.projectId === p.project_id;
              const isRecommended = recommended?.project_id === p.project_id;
              if (isRecommended && recommended) return null; // schon oben
              return (
                <button
                  key={p.project_id}
                  type="button"
                  disabled={readonly}
                  onClick={() =>
                    setSel({ kind: "existing", projectId: p.project_id })
                  }
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    active
                      ? "bg-primary/10 border border-primary/40"
                      : "bg-surface-2/30 border border-transparent hover:border-border-subtle"
                  }`}
                >
                  <FolderOpen className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                  <span className="text-base font-light text-foreground/90 truncate">
                    {p.name}
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground/60 px-4 py-2">
                Kein Treffer.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Neues Projekt */}
      <div className="pt-3 border-t border-border-subtle/50">
        <button
          type="button"
          disabled={readonly}
          onClick={() => setSel({ kind: "new" })}
          className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            sel.kind === "new"
              ? "bg-primary/10 border border-primary/40"
              : "bg-surface-2/30 border border-transparent hover:border-border-subtle"
          }`}
        >
          <Plus className="w-4 h-4 text-muted-foreground/70" />
          <span className="text-base font-light text-foreground/90">
            Neues Projekt anlegen
          </span>
        </button>
        {sel.kind === "new" && !readonly && (
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Projektname"
            className="w-full mt-2 px-4 py-3 text-lg font-light bg-transparent border-b border-border-strong focus:outline-none focus:border-primary text-foreground/95 placeholder:text-muted-foreground/40"
            autoFocus
          />
        )}
      </div>
    </BoxFrame>
  );
};

export default ZuordnungsBox;
