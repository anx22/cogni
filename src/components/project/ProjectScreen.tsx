import { useCallback, useEffect, useState } from "react";

import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import LageZone from "./LageZone";
import HandlungsbedarfList from "./HandlungsbedarfList";
import VerlaufFeed from "./VerlaufFeed";
import SubstanzSection from "./SubstanzSection";
import ProjectHeaderActions from "./ProjectHeaderActions";
import AtmosphereStripe from "./AtmosphereStripe";
import AppSidebar from "@/components/sidebar/AppSidebar";
import CreateProjectDialog from "@/components/entity/CreateProjectDialog";
import InputOverlay from "@/components/entity/InputOverlay";
import { useIntake } from "@/lib/intake/useIntake";
import { detectFromDrop } from "@/lib/intake/detectInputType";
import { useProject } from "@/lib/project/useProject";
import { useProjects } from "@/lib/project/useProjects";
import { useProjectActions } from "@/lib/object-actions/useObjectActions";
import { useBodyScrollLock } from "@/lib/ui/useBodyScrollLock";
import { useDropZone } from "@/lib/intake/useDropZone";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useDialog } from "@/components/dialog/DialogProvider";
import { hasOpenSessionForProject } from "@/lib/dialog/loadSession";
import { useRealtimeTables, type RealtimeListener } from "@/lib/realtime/useRealtimeTables";
import { deriveSignal, SIGNAL_DOT_CLASS, SIGNAL_LABEL } from "@/lib/project/deriveSignal";

interface ProjectScreenProps {
  onBack: () => void;
  /** Echte Projekt-UUID aus der DB. */
  projectId?: string | null;
}

const isUuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

const ProjectScreen = ({ onBack, projectId }: ProjectScreenProps) => {
  const realProjectId = isUuid(projectId) ? projectId : null;
  const navigate = useNavigate();
  const { session: authSession } = useAuth();
  const userId = authSession?.user?.id;
  const { intake } = useIntake({ projectId: realProjectId });
  const { status, project, error, vanished } = useProject(realProjectId);
  const { projects: allProjects } = useProjects();
  const projectActions = useProjectActions();
  const { openSessionFromDB } = useDialog();
  const [forceRename, setForceRename] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [openReviewSessionId, setOpenReviewSessionId] = useState<string | null>(null);

  const handleProjectSelect = useCallback((id: string) => navigate(`/projekt/${id}`), [navigate]);

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
        description:
          "Diese Kachel zeigt noch ein Demo-Projekt — leg ein echtes ab oder wähle ein anderes.",
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

  // Offene Review-Session für „Review öffnen"-Button
  const refreshOpenReview = useCallback(async () => {
    if (!userId || !realProjectId) {
      setOpenReviewSessionId(null);
      return;
    }
    const id = await hasOpenSessionForProject(userId, realProjectId);
    setOpenReviewSessionId(id);
  }, [userId, realProjectId]);

  useEffect(() => {
    refreshOpenReview();
  }, [refreshOpenReview]);

  // Realtime: Status der offenen Session live mitziehen
  const reviewListeners = useCallback(
    (): RealtimeListener[] =>
      userId && realProjectId
        ? [
            {
              table: "dialog_sessions",
              filter: `user_id=eq.${userId}`,
              handler: refreshOpenReview,
            },
          ]
        : [],
    [userId, realProjectId, refreshOpenReview],
  );
  useRealtimeTables(
    userId && realProjectId ? `project-review-${realProjectId}` : null,
    reviewListeners(),
  );

  const handleOpenReview = useCallback(() => {
    if (openReviewSessionId) openSessionFromDB(openReviewSessionId);
  }, [openReviewSessionId, openSessionFromDB]);

  const handleDrop = useCallback(
    (files: File[]) => {
      intake(detectFromDrop(files));
    },
    [intake],
  );

  const { isDragging } = useDropZone({ scope: "window", onDrop: handleDrop });

  // Mobile Safari: Body-Scroll-Lock zentral via Hook (Owner-Set).
  useBodyScrollLock(true);

  const signal = project ? deriveSignal(project) : "calm";

  return (
    <div className="flex overflow-hidden bg-c-surface-0 relative" style={{ height: "100dvh" }}>
      <AppSidebar
        projects={allProjects}
        activeProjectId={realProjectId ?? undefined}
        onProjectSelect={handleProjectSelect}
        onCreateProject={userId ? () => setCreateOpen(true) : undefined}
        showMiniEntity
        onEntityClick={onBack}
      />

      {/* Globaler Atmosphären-Stripe — Lebenszustand des Projekts */}
      <AtmosphereStripe project={project} />

      <div
        className="flex-1 min-w-0 animate-[fade-in_0.5s_ease-out] relative overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {(status === "ready" || status === "empty") && project && realProjectId && (
          <div
            className="sticky top-0 z-30 flex justify-between items-center gap-3 px-6 py-2.5 bg-c-surface-0"
            style={{ borderBottom: "1px solid var(--hair)" }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`dot ${SIGNAL_DOT_CLASS[signal]} shrink-0`}
                aria-hidden
                title={SIGNAL_LABEL[signal]}
              />
              <span className="text-sm text-foreground/90 truncate">{project.name}</span>
            </div>
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
          <LageZone
            project={project}
            forceEdit={forceRename}
            onEditDone={() => setForceRename(false)}
            onNameChange={handleRename}
            variant="shell"
          />
        )}

        {status === "ready" && project && (
          <>
            <LageZone
              project={project}
              forceEdit={forceRename}
              onEditDone={() => setForceRename(false)}
              onNameChange={handleRename}
              onOpenIntake={() => setIntakeOpen(true)}
              onOpenReview={handleOpenReview}
              hasOpenReview={!!openReviewSessionId}
            />

            <section className="bg-surface-1" style={{ padding: "32px 56px 40px" }}>
              <div className="grid grid-cols-1 lg:grid-cols-5" style={{ gap: 32 }}>
                <div className="lg:col-span-3 min-w-0">
                  <HandlungsbedarfList items={project.handlungsbedarf} projectId={realProjectId} />
                </div>
                <div className="lg:col-span-2 min-w-0">
                  <VerlaufFeed verlauf={project.verlauf} projectId={realProjectId} />
                </div>
              </div>
            </section>

            <SubstanzSection
              themen={project.themen}
              dokumente={project.dokumente}
              projectId={realProjectId}
            />
          </>
        )}

        {isDragging && (
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

        {intakeOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-background/70 backdrop-blur-sm p-4"
            onClick={() => setIntakeOpen(false)}
          >
            <div className="w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
              <InputOverlay
                open={intakeOpen}
                onClose={() => setIntakeOpen(false)}
                onSubmit={(payload) => {
                  intake(payload);
                  setIntakeOpen(false);
                }}
                contextHint={`Wird direkt an „${project?.name ?? "dieses Projekt"}" angehängt.`}
              />
            </div>
          </div>
        )}
      </div>

      {userId && (
        <CreateProjectDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          userId={userId}
          onCreated={(id) => navigate(`/projekt/${id}`)}
        />
      )}
    </div>
  );
};

export default ProjectScreen;
