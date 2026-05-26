// =============================================================================
//  ProjectHeaderActions — Rename/Archive/Delete für aktives Projekt.
// =============================================================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConfirmDestructive from "@/components/shared/ConfirmDestructive";
import { useProjectActions } from "@/lib/object-actions/useObjectActions";
import { cn } from "@/lib/utils";

interface Props {
  projectId: string;
  projectName: string;
  status?: string;
  onRequestRename?: () => void;
}

const ProjectHeaderActions = ({ projectId, projectName, status, onRequestRename }: Props) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const actions = useProjectActions();
  const navigate = useNavigate();
  const archived = status === "archived";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Projekt-Aktionen"
            disabled={actions.pending}
            className={cn(
              "p-2 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-surface-2/60 transition-colors",
              actions.pending && "opacity-40 pointer-events-none",
            )}
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-[200px]"
        >
          <DropdownMenuItem disabled={actions.pending} onClick={() => onRequestRename?.()}>
            Umbenennen
          </DropdownMenuItem>
          {archived ? (
            <DropdownMenuItem
              disabled={actions.pending}
              onClick={() => actions.unarchive(projectId)}
            >
              Wiederherstellen
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled={actions.pending} onClick={() => actions.archive(projectId)}>
              Archivieren
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={actions.pending}
            className="text-rose-400 focus:text-rose-300"
            onClick={() => setConfirmDelete(true)}
          >
            Löschen…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDestructive
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`„${projectName}" löschen?`}
        description="Das Projekt und alle zugehörigen Inputs, Fakten, Verläufe und Konflikte werden unwiderruflich entfernt. Wenn du dir nicht sicher bist, archiviere stattdessen."
        onConfirm={async () => {
          // Erst zur Entität navigieren, dann löschen — vermeidet leeren ProjectScreen-Render.
          navigate("/", { replace: true });
          await actions.remove(projectId);
        }}
      />
    </>
  );
};

export default ProjectHeaderActions;
