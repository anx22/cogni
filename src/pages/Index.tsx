import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EntityRail from "@/components/entity/EntityRail";
import EntityVoice from "@/components/entity/EntityVoice";
import AppSidebar from "@/components/sidebar/AppSidebar";
import HomePrompt from "@/components/home/HomePrompt";
import ImpactPipelinePanel from "@/components/home/ImpactPipelinePanel";
import MobileNavSheet from "@/components/home/MobileNavSheet";
import HomeDropOverlay from "@/components/entity/HomeDropOverlay";
import AssetOrbit from "@/components/entity/AssetOrbit";
import InputOverlay from "@/components/entity/InputOverlay";
import AccountDrawer from "@/components/home/AccountDrawer";
import CreateProjectDialog from "@/components/project/CreateProjectDialog";
import { useProjects } from "@/lib/project/useProjects";
import { useIntake } from "@/lib/intake/useIntake";
import { detectFromDrop } from "@/lib/intake/detectInputType";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { devlog } from "@/lib/devlog/devlog";
import { useDialog } from "@/components/dialog/DialogProvider";
import { useEntityVoice } from "@/lib/voice/useEntityVoice";
import { useBodyScrollLock } from "@/lib/ui/useBodyScrollLock";
import { useDropZone } from "@/lib/intake/useDropZone";
import { toast } from "sonner";
import { useEntity } from "@/lib/entity";

const Index = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { openSessionFromDB } = useDialog();
  const { state: entityState, controller } = useEntity();

  const { intake } = useIntake();
  const voice = useEntityVoice(session?.user?.id);
  const { projects: liveProjects, error: projectsError, reload: reloadProjects } = useProjects();

  const busy = entityState === "processing" || entityState === "review-ready";

  useEffect(() => {
    if (!loading && !session) navigate("/auth", { replace: true });
  }, [loading, session, navigate]);

  // Auto-open: EntitySources feuert nach 1400 ms — openSessionFromDB als Handler.
  useEffect(() => {
    controller.setAutoOpenHandler(openSessionFromDB);
    return () => controller.setAutoOpenHandler(null);
  }, [controller, openSessionFromDB]);

  const handleDrop = useCallback(
    (files: File[]) => {
      if (busy) {
        toast.message("Noch beschäftigt", { description: "Ich bin gleich wieder bei dir." });
        return;
      }
      intake(detectFromDrop(files));
    },
    [intake, busy],
  );

  // Globale Drop-Zone auf window — eine State-Quelle für HomeDropOverlay + Entity.
  const { isDragging } = useDropZone({ scope: "window", busy, onDrop: handleDrop });

  const handleProjectClick = useCallback(
    (id: string) => {
      navigate(`/projekt/${id}`);
    },
    [navigate],
  );

  const handleCreateProject = useCallback(() => {
    if (!session?.user) return;
    setCreateOpen(true);
  }, [session?.user]);

  const handleReviewClick = useCallback(() => {
    controller.openPendingSession();
  }, [controller]);

  const handleCoreClick = useCallback(() => {
    if (busy && entityState !== "review-ready") return;
    if (entityState === "review-ready") {
      controller.openPendingSession();
    } else {
      setOverlayOpen(true);
    }
  }, [entityState, busy, controller]);

  const handleRetry = useCallback(
    async (assetId: string) => {
      devlog.edge("retry intake-understand", { assetId });
      controller.signal({ kind: "intake.progress" });
      await supabase.functions.invoke("intake-understand", {
        body: { asset_id: assetId, retry: true },
      });
    },
    [controller],
  );

  // Lock body scroll on Home — kein Bounce in Safari, voller Touch für die Entität.
  useBodyScrollLock(true);

  if (loading || !session) return null;

  return (
    <div
      className="relative flex w-full overflow-hidden overscroll-none bg-c-surface-0"
      style={{ height: "100dvh" }}
    >
      <AppSidebar
        projects={liveProjects}
        activeProjectId={undefined}
        onProjectSelect={handleProjectClick}
        onCreateProject={handleCreateProject}
        showMiniEntity={false}
      />

      {/* Home-Stack: Intake-Bühne in der Mitte, AssetOrbit-Chips floating */}
      <main className="relative flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Chip-Orbit — positioniert relativ zur Fläche (kein Entity mehr hier) */}
        <div className="relative flex-1 min-h-0 flex items-center justify-center">
          <AssetOrbit />
        </div>

        {/* Eingabe-Slot (HomePrompt oder InputOverlay) */}
        <div className="shrink-0 flex justify-center px-4 pb-3">
          {overlayOpen ? (
            <div className="w-full max-w-xl z-30">
              <InputOverlay
                open={overlayOpen}
                onClose={() => setOverlayOpen(false)}
                onSubmit={intake}
                contextHint="Wird global aufgenommen — Zuordnung kommt im Dialog."
              />
            </div>
          ) : (
            <HomePrompt
              onUpload={() => setOverlayOpen(true)}
              onPaste={() => setOverlayOpen(true)}
              onLink={() => setOverlayOpen(true)}
              onVoice={() => setOverlayOpen(true)}
              onNote={() => setOverlayOpen(true)}
            />
          )}
        </div>

        {/* Voice + Hint — fester Footer-Slot */}
        <div className="shrink-0 flex flex-col items-center justify-end pb-4 px-4 min-h-[64px]">
          <EntityVoice voice={voice} onRetry={handleRetry} />
          {!voice.text && !overlayOpen && (
            <p className="t-small opacity-50 mt-1 ink-4 text-center motion-safe:animate-float-in">
              Lege etwas ab oder tippe — Datei, Link, Notiz
            </p>
          )}
        </div>
      </main>

      {/* Entity persistent rechts */}
      <EntityRail
        onCoreClick={handleCoreClick}
        onDrop={handleDrop}
        onReviewClick={handleReviewClick}
        onPickInputMode={() => setOverlayOpen(true)}
        showAccount
      >
        <ImpactPipelinePanel />
      </EntityRail>

      <div className="absolute top-4 right-4 flex items-center gap-4 z-40 lg:hidden">
        <AccountDrawer />
      </div>

      <MobileNavSheet
        projects={liveProjects}
        projectsError={projectsError}
        onReloadProjects={reloadProjects}
        onProjectClick={handleProjectClick}
        onCreateProject={handleCreateProject}
      />

      <HomeDropOverlay active={isDragging} busy={busy} />

      {session?.user && (
        <CreateProjectDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          userId={session.user.id}
          onCreated={(id) => navigate(`/projekt/${id}`)}
        />
      )}
    </div>
  );
};

export default Index;
