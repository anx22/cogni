import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Entity from "@/components/entity/Entity";
import { useSelectedCharacter } from "@/components/entity/useSelectedCharacter";
import EntityVoice from "@/components/entity/EntityVoice";
import AppSidebar from "@/components/sidebar/AppSidebar";
import HomePrompt from "@/components/home/HomePrompt";
import ImpactPipelinePanel from "@/components/home/ImpactPipelinePanel";
import MobileNavSheet from "@/components/entity/MobileNavSheet";
import HomeDropOverlay from "@/components/entity/HomeDropOverlay";
import AssetOrbit from "@/components/entity/AssetOrbit";
import InputOverlay from "@/components/entity/InputOverlay";
import AccountDrawer from "@/components/entity/AccountDrawer";
import CreateProjectDialog from "@/components/entity/CreateProjectDialog";
import { useProjects } from "@/lib/project/useProjects";
import { useIntake } from "@/lib/intake/useIntake";
import { detectFromDrop } from "@/lib/intake/detectInputType";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { devlog } from "@/lib/devlog/devlog";
import { useDialog } from "@/components/dialog/DialogProvider";
import { useEntityVoice } from "@/lib/voice/useEntityVoice";
import { useRealtimeTables, type RealtimeListener } from "@/lib/realtime/useRealtimeTables";
import { useBodyScrollLock } from "@/lib/ui/useBodyScrollLock";
import { useDropZone } from "@/lib/intake/useDropZone";
import { toast } from "sonner";
import type { EntityState } from "@/components/entity/orbPresets";

const Index = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [entityState, setEntityState] = useState<EntityState>("idle");
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { openSessionFromDB, session: dialogSession } = useDialog();
  const pendingSessionId = useRef<string | null>(null);
  const autoOpenedRef = useRef<Set<string>>(new Set());

  const { intake } = useIntake({ setEntityState });
  const { characterId } = useSelectedCharacter();
  const voice = useEntityVoice(session?.user?.id);
  const { projects: liveProjects, error: projectsError, reload: reloadProjects } = useProjects();

  const busy = entityState === "processing" || entityState === "review-ready";

  useEffect(() => {
    if (!loading && !session) navigate("/auth", { replace: true });
  }, [loading, session, navigate]);

  // Realtime: Asset-Status spiegelt sich auf den Kern + Auto-Open neuer Sessions.
  const userId = session?.user?.id;
  const realtimeListeners = useMemo<RealtimeListener[]>(() => {
    if (!userId) return [];
    const filter = `user_id=eq.${userId}`;
    return [
      {
        table: "assets",
        event: "INSERT",
        filter,
        handler: (payload) => {
          const row = payload.new as { id?: string; file_type?: string };
          devlog.realtime(`assets INSERT → ${row.file_type}`, { id: row.id });
          setEntityState("processing");
        },
      },
      {
        table: "assets",
        event: "UPDATE",
        filter,
        handler: (payload) => {
          const row = payload.new as {
            id?: string;
            understanding_status?: string;
            processing_status?: string;
          };
          if (row.processing_status === "processing" || row.understanding_status === "running") {
            setEntityState("processing");
          } else if (
            row.understanding_status === "failed" ||
            row.understanding_status === "rate_limited" ||
            row.understanding_status === "payment_required"
          ) {
            setEntityState("failed");
          } else if (row.understanding_status === "empty") {
            setTimeout(() => setEntityState("idle"), 1500);
          }
        },
      },
      {
        table: "dialog_sessions",
        event: "INSERT",
        filter,
        handler: (payload) => {
          const row = payload.new as { id?: string; status?: string; trigger_type?: string };
          devlog.realtime(`dialog_session INSERT → ${row.status}`, { id: row.id });
          if (row.status === "open" && row.id && row.trigger_type === "intake") {
            if (autoOpenedRef.current.has(row.id)) return;
            autoOpenedRef.current.add(row.id);
            pendingSessionId.current = row.id;
            setEntityState("review-ready");
            setTimeout(() => {
              if (pendingSessionId.current === row.id) {
                openSessionFromDB(row.id!);
                pendingSessionId.current = null;
                setEntityState("idle");
              }
            }, 1400);
          }
        },
      },
    ];
  }, [userId, openSessionFromDB]);

  useRealtimeTables(userId ? `index-realtime-${userId}` : null, realtimeListeners);

  // Wenn Dialog manuell geschlossen wird → Kern beruhigen.
  useEffect(() => {
    if (!dialogSession && entityState === "review-ready") {
      setEntityState("idle");
    }
  }, [dialogSession, entityState]);

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

  const handleReviewClick = useCallback(async () => {
    if (pendingSessionId.current) {
      await openSessionFromDB(pendingSessionId.current);
      pendingSessionId.current = null;
      setEntityState("idle");
    }
  }, [openSessionFromDB]);

  const handleCoreClick = useCallback(() => {
    if (busy && entityState !== "review-ready") return;
    if (pendingSessionId.current) {
      handleReviewClick();
    } else {
      setOverlayOpen(true);
    }
  }, [entityState, handleReviewClick, busy]);

  const handleRetry = useCallback(async (assetId: string) => {
    devlog.edge("retry intake-understand", { assetId });
    setEntityState("processing");
    await supabase.functions.invoke("intake-understand", {
      body: { asset_id: assetId, retry: true },
    });
  }, []);

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

      {/* Home-Stack: Entity oben (flex-1, mittig), Prompt + Voice darunter im Footer */}
      <main className="relative flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Entität-Bühne — füllt verfügbaren Raum, zentriert */}
        <div className="relative flex-1 min-h-0 flex items-center justify-center">
          <AssetOrbit />
          <Entity
            state={entityState}
            onDrop={handleDrop}
            onReviewClick={handleReviewClick}
            onClick={handleCoreClick}
            busy={busy}
            character={characterId}
            onPickInputMode={() => setOverlayOpen(true)}
            size="clamp(220px, 38vh, 320px)"
          />
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

        {/* Voice + Hint — fester Footer-Slot, reserviert Platz */}
        <div className="shrink-0 flex flex-col items-center justify-end pb-4 px-4 min-h-[64px]">
          <EntityVoice voice={voice} onRetry={handleRetry} />
          {!voice.text && !overlayOpen && (
            <p className="t-small opacity-50 mt-1 ink-4 text-center motion-safe:animate-float-in">
              Klick auf den Kern oder lege etwas hier ab — Datei, Link, Notiz
            </p>
          )}
        </div>
      </main>

      <ImpactPipelinePanel />

      <div className="absolute top-6 right-6 flex items-center gap-4 z-40">
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
