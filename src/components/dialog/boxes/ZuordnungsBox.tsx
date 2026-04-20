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
  const { commitBox, readonly } = useDialog();

  const candidates: Candidate[] = (box.payload?.candidates as Candidate[] | undefined) ?? [];
  const suggestedNewName: string | undefined = box.payload?.suggested_new_name ?? undefined;
  const agentReason: string | undefined = box.payload?.agent_reason ?? undefined;
  const mode: string | undefined = box.payload?.assignment_mode;

  const defaultSelection: string =
    mode === "new" || candidates.length === 0
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
        <ActionBtn
          variant="primary"
          icon={<Check className="w-4 h-4" />}
          onClick={handleConfirm}
        >
          Zuordnen
        </ActionBtn>
      }
    >
      {agentReason && (
        <p className="text-lg text-foreground/80 font-light leading-relaxed">
          {agentReason}
        </p>
      )}

      <div className="space-y-2 pt-2">
        {candidates.map((c) => {
          const active = sel === c.project_id;
          return (
            <label
              key={c.project_id}
              className={`flex items-center gap-4 px-5 py-4 rounded-lg cursor-pointer transition-colors ${
                active
                  ? "bg-primary/10 border border-primary/40"
                  : "bg-surface-2/40 border border-transparent hover:border-border-subtle"
              } ${readonly ? "pointer-events-none" : ""}`}
            >
              <input
                type="radio"
                checked={active}
                onChange={() => setSel(c.project_id)}
                disabled={readonly}
                className="accent-primary w-4 h-4"
              />
              <div className="flex-1 min-w-0">
                <div className="text-lg text-foreground/95 font-light truncate">{c.name}</div>
                {c.reasons && c.reasons.length > 0 && (
                  <div className="text-sm text-muted-foreground/60 truncate mt-0.5">
                    {c.reasons.slice(0, 2).join(" · ")}
                  </div>
                )}
              </div>
            </label>
          );
        })}

        <label
          className={`flex items-center gap-4 px-5 py-4 rounded-lg cursor-pointer transition-colors ${
            sel === "__new__"
              ? "bg-primary/10 border border-primary/40"
              : "bg-surface-2/40 border border-transparent hover:border-border-subtle"
          } ${readonly ? "pointer-events-none" : ""}`}
        >
          <input
            type="radio"
            checked={sel === "__new__"}
            onChange={() => setSel("__new__")}
            disabled={readonly}
            className="accent-primary w-4 h-4"
          />
          <Plus className="w-4 h-4 text-muted-foreground/70" />
          <span className="text-lg text-foreground/90 font-light">Neues Projekt</span>
        </label>

        {sel === "__new__" && !readonly && (
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Projektname"
            className="w-full mt-2 px-5 py-3 text-xl font-light bg-transparent border-b border-border-strong focus:outline-none focus:border-primary text-foreground/95 placeholder:text-muted-foreground/40"
            autoFocus
          />
        )}
      </div>
    </BoxFrame>
  );
};

export default ZuordnungsBox;
