import { useState } from "react";
import { useDialog } from "../DialogProvider";
import BoxFrame, { ActionBtn } from "../BoxFrame";
import { Check, Plus } from "lucide-react";
import type { DialogBox } from "@/lib/dialog/types";

interface Candidate {
  project_id: string;
  name: string;
  score?: number;
  reasons?: string[];
}

const ZuordnungsBox = ({ box }: { box: DialogBox }) => {
  const { commitBox } = useDialog();

  const candidates: Candidate[] = (box.payload?.candidates as Candidate[] | undefined) ?? [];
  const suggestedNewName: string | undefined = box.payload?.suggested_new_name ?? undefined;
  const agentReason: string | undefined = box.payload?.agent_reason ?? undefined;
  const mode: string | undefined = box.payload?.assignment_mode;

  // Default-Auswahl: bei "auto" oder "uncertain" der Top-Kandidat,
  // bei "new" der Vorschlagsname als neues Projekt.
  const defaultSelection: string =
    mode === "new"
      ? "__new__"
      : candidates[0]?.project_id ?? "__new__";

  const [sel, setSel] = useState<string>(defaultSelection);
  const [newName, setNewName] = useState<string>(suggestedNewName ?? "");

  const handleConfirm = () => {
    if (sel === "__new__") {
      const name = newName.trim() || suggestedNewName?.trim() || "Neues Projekt";
      commitBox(box.id, "confirm", { new_project_name: name });
    } else {
      commitBox(box.id, "confirm", { project_id: sel });
    }
  };

  return (
    <BoxFrame
      box={box}
      actions={
        <>
          <ActionBtn
            variant="primary"
            icon={<Check className="w-3 h-3" />}
            onClick={handleConfirm}
          >
            Zuordnen
          </ActionBtn>
          <ActionBtn onClick={() => commitBox(box.id, "reject")}>Später</ActionBtn>
        </>
      }
    >
      {agentReason && (
        <p className="text-xs text-muted-foreground/70 italic">{agentReason}</p>
      )}
      <p className="text-sm text-foreground/90">
        {box.payload?.frage ?? "Welches Projekt passt?"}
      </p>
      <div className="space-y-1.5">
        {candidates.map((c) => (
          <label
            key={c.project_id}
            className="flex items-start gap-2 px-3 py-2 rounded-md bg-surface-3 border border-border-subtle cursor-pointer hover:border-border-strong"
          >
            <input
              type="radio"
              checked={sel === c.project_id}
              onChange={() => setSel(c.project_id)}
              className="mt-0.5 accent-primary"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-foreground/90 truncate">{c.name}</div>
              {c.reasons && c.reasons.length > 0 && (
                <div className="text-[10px] text-muted-foreground/60 truncate">
                  {c.reasons.slice(0, 2).join(" · ")}
                </div>
              )}
            </div>
          </label>
        ))}

        <label className="flex items-center gap-2 px-3 py-2 rounded-md bg-surface-3 border border-border-subtle cursor-pointer hover:border-border-strong">
          <input
            type="radio"
            checked={sel === "__new__"}
            onChange={() => setSel("__new__")}
            className="accent-primary"
          />
          <Plus className="w-3 h-3 text-muted-foreground/70" />
          <span className="text-sm text-foreground/90">Neues Projekt</span>
        </label>

        {sel === "__new__" && (
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Projektname"
            className="w-full mt-1 px-3 py-2 text-sm bg-surface-2 border border-border-subtle rounded-md focus:outline-none focus:border-primary/50 text-foreground/90"
            autoFocus
          />
        )}
      </div>
    </BoxFrame>
  );
};

export default ZuordnungsBox;
