import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import EntityCore from "@/components/EntityCore";
import EntityVoice from "@/components/entity/EntityVoice";
import ProjectScreen from "@/components/project/ProjectScreen";
import SideGrid from "@/components/entity/SideGrid";
import RecentAssets from "@/components/entity/RecentAssets";
import InputOverlay from "@/components/entity/InputOverlay";
import { demoProjects } from "@/data/demoProjects";
import { useIntake } from "@/lib/intake/useIntake";
import { detectFromDrop } from "@/lib/intake/detectInputType";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { devlog } from "@/lib/devlog/devlog";
import { useDialog } from "@/components/dialog/DialogProvider";
import { useEntityVoice } from "@/lib/voice/useEntityVoice";

type EntityState = "idle" | "hover" | "processing" | "review-ready" | "failed";
type AppView = "entity" | "project";

const Index = () => {
  const navigate = useNavigate();
  const { session, loading, signOut } = useAuth();
  const [entityState, setEntityState] = useState<EntityState>("idle");
  const [view, setView] = useState<AppView>("entity");
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const { openSessionFromDB } = useDialog();
  const pendingSessionId = useRef<string | null>(null);

  const { intake } = useIntake({ setEntityState });
  const voice = useEntityVoice(session?.user?.id);

  const isDragActive = entityState === "hover";

  useEffect(() => {
    if (!loading && !session) navigate("/auth", { replace: true });
  }, [loading, session, navigate]);

  // Realtime: understanding_status auf den Kern spiegeln
  useEffect(() => {
    if (!session?.user) return;
    const channel = supabase
      .channel("assets-understanding")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "assets",
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          const row = payload.new as { id?: string; file_type?: string };
          devlog.realtime(`assets INSERT → ${row.file_type}`, { id: row.id });
          setEntityState("processing");
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "assets",
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          const row = payload.new as {
            id?: string;
            understanding_status?: string;
            processing_status?: string;
          };
          devlog.realtime(
            `assets UPDATE → parsing:${row.processing_status} understanding:${row.understanding_status}`,
            { id: row.id },
          );
          if (row.processing_status === "processing" || row.understanding_status === "running") {
            setEntityState("processing");
          } else if (
            row.understanding_status === "failed" ||
            row.understanding_status === "rate_limited" ||
            row.understanding_status === "payment_required"
          ) {
            setEntityState("failed");
          } else if (row.understanding_status === "empty") {
            setEntityState("idle");
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user]);

  // Realtime: neue Dialog-Session → Kern wird "review-ready"
  useEffect(() => {
    if (!session?.user) return;
    const channel = supabase
      .channel("dialog-sessions-new")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dialog_sessions",
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          const row = payload.new as { id?: string; status?: string };
          devlog.realtime(`dialog_session INSERT → ${row.status}`, { id: row.id });
          if (row.status === "open" && row.id) {
            pendingSessionId.current = row.id;
            setEntityState("review-ready");
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user]);

  const handleDrop = useCallback(
    (files: File[]) => {
      intake(detectFromDrop(files));
    },
    [intake],
  );

  const handleProjectClick = useCallback((id: string) => {
    setActiveProjectId(id);
    setView("project");
  }, []);

  const handleReviewClick = useCallback(async () => {
    if (pendingSessionId.current) {
      await openSessionFromDB(pendingSessionId.current);
      pendingSessionId.current = null;
      setEntityState("idle");
    }
  }, [openSessionFromDB]);

  const handleCoreClick = useCallback(() => {
    if (entityState === "review-ready" && pendingSessionId.current) {
      handleReviewClick();
    } else {
      setOverlayOpen(true);
    }
  }, [entityState, handleReviewClick]);

  const handleRetry = useCallback(async (assetId: string) => {
    devlog.edge("retry intake-understand", { assetId });
    setEntityState("processing");
    await supabase.functions.invoke("intake-understand", {
      body: { asset_id: assetId, retry: true },
    });
  }, []);

  if (loading || !session) return null;

  if (view === "project") {
    return <ProjectScreen onBack={() => setView("entity")} />;
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-background">
      <div className="relative w-full flex-1 flex items-center justify-center">
        <div className="hidden lg:block absolute left-[6%] top-1/2 -translate-y-1/2 z-10">
          <SideGrid
            side="left"
            label="Projekte"
            projects={demoProjects}
            activeId={activeProjectId}
            onProjectClick={handleProjectClick}
            isDragActive={isDragActive}
          />
        </div>

        <div className="hidden xl:block absolute right-[6%] top-1/2 -translate-y-1/2 z-10">
          <RecentAssets isDragActive={isDragActive} />
        </div>

        <EntityCore
          state={entityState}
          onDrop={handleDrop}
          onReviewClick={handleReviewClick}
          onClick={handleCoreClick}
        />

        {/* Live-Stimme der Intelligenz: schwebt mittig unter dem Kern */}
        <div className="absolute bottom-[22%] z-20 pointer-events-auto">
          <EntityVoice voice={voice} onRetry={handleRetry} />
        </div>

        {!voice.text && (
          <p className="absolute bottom-[14%] text-muted-foreground text-sm tracking-wide opacity-50 animate-float-in">
            Klick auf den Kern oder lege etwas hier ab — Datei, Link, Notiz
          </p>
        )}
      </div>

      <div className="absolute top-6 right-6 flex items-center gap-4">
        <button
          className="text-xs text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors tracking-widest uppercase"
          onClick={() => setView("project")}
        >
          Projekte
        </button>
        <button
          className="text-xs text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors tracking-widest uppercase"
          onClick={signOut}
        >
          Abmelden
        </button>
      </div>

      <InputOverlay
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        onSubmit={intake}
      />
    </div>
  );
};

export default Index;
