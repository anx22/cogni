import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import LageZone from "./LageZone";
import HandlungsbedarfList from "./HandlungsbedarfList";
import VerlaufFeed from "./VerlaufFeed";
import SubstanzSection from "./SubstanzSection";
import ProjectHeaderActions from "./ProjectHeaderActions";
import ProjectSwitcher from "./ProjectSwitcher";
import { useIntake } from "@/lib/intake/useIntake";
import { detectFromDrop } from "@/lib/intake/detectInputType";
import { useProject } from "@/lib/project/useProject";
import { useProjectActions } from "@/lib/object-actions/useObjectActions";
import { Skeleton } from "@/components/ui/skeleton";


interface ProjectScreenProps {
  onBack: () => void;
  /** Echte Projekt-UUID aus der DB. */
  projectId?: string | null;
}

const isUuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

const ProjectScreen = ({ onBack, projectId }: ProjectScreenProps) => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const realProjectId = isUuid(projectId) ? projectId : null;
  const { intake } = useIntake({ projectId: realProjectId });
  const { status, project, error, vanished } = useProject(realProjectId);
  const projectActions = useProjectActions();
  const [forceRename, setForceRename] = useState(false);

  const handleRename = useCallback(
    async (newName: string) => {
      if (!realProjectId || !newName.trim()) return;
      await projectActions.rename(realProjectId, newName);
    },
    [realProjectId, projectActions],
  );

  // Demo-/Fake-IDs: zurück zur Entität mit Hinweis
  useEffect(() => {
    if (projectId && !realProjectId) {
      toast.error("Projekt nicht gefunden", {
        description: "Diese Kachel zeigt noch ein Demo-Projekt — leg ein echtes ab oder wähle ein anderes.",
      });
      onBack();
    }
  }, [projectId, realProjectId, onBack]);

  // Projekt gelöscht oder archiviert während wir es ansehen → sauber raus.
  useEffect(() => {
    if (vanished) {
      toast.message("Projekt nicht mehr verfügbar", {
        description: error ?? "Es wurde gelöscht oder archiviert.",
      });
      onBack();
    }
  }, [vanished, error, onBack]);

  useEffect(() => {
    if (status === "error" && error && !vanished) {
      toast.error("Projekt konnte nicht geladen werden", { description: error });
    }
  }, [status, error, vanished]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) setDragActive(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const files = Array.from(e.dataTransfer.files ?? []);
      if (files.length === 0) return;
      intake(detectFromDrop(files));
    },
    [intake],
  );

  return (
    <div
      className="min-h-screen bg-surface-0 animate-[fade-in_0.5s_ease-out] relative"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <button
        onClick={onBack}
        className="fixed top-6 left-8 z-50 text-xs text-muted-foreground/60 hover:text-foreground/90 transition-colors tracking-widest uppercase"
      >
        ← Entität
      </button>

      {(status === "ready" || status === "empty") && project && realProjectId && (
        <div className="fixed top-5 right-6 z-50 flex items-center gap-2">
          <ProjectSwitcher
            currentId={realProjectId}
            currentName={project.name}
            globalShortcut
          />
          <ProjectHeaderActions
            projectId={realProjectId}
            projectName={project.name}
            onRequestRename={() => setForceRename(true)}
          />
        </div>
      )}

      {status === "loading" && (
        <section className="px-8 md:px-12 lg:px-16 xl:px-20 pt-16 pb-12 bg-surface-1 border-b border-border-strong">
          <div className="max-w-7xl mx-auto space-y-6">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-4 w-full max-w-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </section>
      )}

      {status === "empty" && project && (
        <>
          <LageZone
            project={project}
            editableName
            forceEdit={forceRename}
            onEditDone={() => setForceRename(false)}
            onNameChange={handleRename}
          />
          <section className="px-8 md:px-12 lg:px-16 xl:px-20 py-24 bg-surface-1 border-b border-border-strong">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-3">Noch keine Substanz</p>
              <p className="text-lg text-foreground/90 font-light leading-relaxed">
                Lege eine Datei, einen Link oder eine Notiz ab — ich beginne mit dem Verstehen.
              </p>
            </div>
          </section>
        </>
      )}

      {status === "ready" && project && (
        <>
          <LageZone
            project={project}
            editableName
            forceEdit={forceRename}
            onEditDone={() => setForceRename(false)}
            onNameChange={handleRename}
          />

          <section className="px-8 md:px-12 lg:px-16 xl:px-20 py-16 bg-surface-1 border-b border-border-strong">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 min-w-0">
                <VerlaufFeed verlauf={project.verlauf} />
              </div>
              <div className="lg:col-span-2 min-w-0">
                <HandlungsbedarfList items={project.handlungsbedarf} />
              </div>
            </div>
          </section>

          <SubstanzSection themen={project.themen} dokumente={project.dokumente} />
        </>
      )}

      {dragActive && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-background/60 backdrop-blur-sm pointer-events-none transition-opacity"
          aria-hidden
        >
          <div className="border-2 border-dashed border-primary/60 rounded-2xl px-12 py-10 bg-surface-1/80">
            <p className="text-2xl font-light tracking-wide text-foreground/90">
              {realProjectId
                ? `Ablegen für „${project?.name ?? "dieses Projekt"}"`
                : "Ablegen — Zuordnung im Dialog"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground/70 tracking-wide">
              {realProjectId
                ? "Ich hänge es direkt an dieses Projekt."
                : "Ich frage dich gleich, wohin es gehört."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectScreen;
