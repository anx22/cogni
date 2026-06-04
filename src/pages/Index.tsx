import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EntityRoot from "@/components/entity/EntityRoot";
import { useSelectedCharacter } from "@/components/entity/useSelectedCharacter";
import { useOrbSizeTier } from "@/components/entity/useOrbSizeTier";
import { ORB_TIER_HOME_SIZE } from "@/components/entity/presets/orbSizeTier";
import EntityVoiceLine from "@/components/entity/EntityVoiceLine";
import AppSidebar from "@/components/sidebar/AppSidebar";
import ImpactPipelinePanel from "@/components/home/ImpactPipelinePanel";
import MobileNavSheet from "@/components/home/MobileNavSheet";
import HomeDropOverlay from "@/components/entity/HomeDropOverlay";
import AssetOrbit from "@/components/entity/satellites/AssetOrbit";
import EntityComposer from "@/components/entity/input/EntityComposer";
import AccountDrawer from "@/components/home/AccountDrawer";
import CreateProjectDialog from "@/components/project/CreateProjectDialog";
import { useProjects } from "@/lib/project/useProjects";
import { useIntake } from "@/lib/intake/useIntake";
import { detectFromDrop } from "@/lib/intake/detectInputType";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { devlog } from "@/lib/devlog/devlog";
import { useDialog } from "@/components/dialog/DialogProvider";
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
  const { state: entityState, controller, utterance } = useEntity();
  const { characterId } = useSelectedCharacter();
  const { tier } = useOrbSizeTier();

  const { intake } = useIntake();
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

      {/* Home-Stack: Entität zentral (Herz der App), AssetOrbit-Chips drumherum */}
      <main className="relative flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Entitäts-Bühne — füllt verfügbaren Raum, zentriert */}
        <div className="relative flex-1 min-h-0 flex items-center justify-center">
          <AssetOrbit />
          <EntityRoot
            state={entityState}
            size={ORB_TIER_HOME_SIZE[tier]}
            onDrop={handleDrop}
            onReviewClick={handleReviewClick}
            onClick={handleCoreClick}
            busy={busy}
            character={characterId}
            onPickInputMode={() => setOverlayOpen(true)}
          />
        </div>

        {/* Eingabe-Slot — Unified Composer (ruhende Leiste, morpht bei Fokus) */}
        <div className="shrink-0 flex justify-center px-4 pb-3 z-30">
          <EntityComposer
            open={overlayOpen}
            onOpenChange={setOverlayOpen}
            onSubmit={intake}
            contextHint="Wird global aufgenommen — Zuordnung kommt im Dialog."
          />
        </div>

        {/* Voice + Hint — fester Footer-Slot */}
        <div className="shrink-0 flex flex-col items-center justify-end pb-4 px-4 min-h-[64px]">
          <EntityVoiceLine onRetry={handleRetry} />
          {!utterance?.text && !overlayOpen && (
            <p className="t-small opacity-50 mt-1 ink-4 text-center motion-safe:animate-float-in">
              Lege etwas ab oder tippe — Datei, Link, Notiz
            </p>
          )}
        </div>
      </main>

      {/* Impact-Panel rechts (xl+) — die Entität ist zentral, nicht hier.
          Die EntityRail gilt nur für den Projekt-Detail-Screen. */}
      <ImpactPipelinePanel />

      <div className="absolute top-4 right-4 flex items-center gap-4 z-40">
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
