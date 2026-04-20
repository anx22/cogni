import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EntityCore from "@/components/EntityCore";
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

type EntityState = "idle" | "hover" | "processing" | "review-ready" | "failed";
type AppView = "entity" | "project";

const Index = () => {
  const navigate = useNavigate();
  const { session, loading, signOut } = useAuth();
  const [entityState, setEntityState] = useState<EntityState>("idle");
  const [lastImpact, setLastImpact] = useState<string | null>(null);
  const [view, setView] = useState<AppView>("entity");
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>();
  const [overlayOpen, setOverlayOpen] = useState(false);

  const { intake } = useIntake({ setEntityState, setLastImpact });

  const isDragActive = entityState === "hover";

  useEffect(() => {
    if (!loading && !session) navigate("/auth", { replace: true });
  }, [loading, session, navigate]);

  // Realtime: spiegle Verarbeitungsstatus auf den Kern
  useEffect(() => {
    if (!session?.user) return;
    const channel = supabase
      .channel("assets-status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "assets" },
        (payload) => {
          const row = payload.new as { id?: string; processing_status?: string; file_name?: string };
          devlog.realtime(`assets UPDATE → ${row.processing_status}`, {
            id: row.id,
            file_name: row.file_name,
          });
          const status = row.processing_status;
          if (status === "processing") setEntityState("processing");
          else if (status === "completed") {
            setEntityState("idle");
            setLastImpact("verarbeitet");
          } else if (status === "failed") {
            setEntityState("failed");
            setLastImpact("fehlgeschlagen");
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

  const handleReviewClick = useCallback(() => {
    console.log("Review triggered");
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
          onClick={() => setOverlayOpen(true)}
        />

        <p className="absolute bottom-[18%] text-muted-foreground text-sm tracking-wide opacity-60 animate-float-in">
          Klick auf den Kern oder lege etwas hier ab — Datei, Link, Notiz
        </p>
      </div>

      <div className="absolute bottom-8 flex items-center gap-8 text-xs text-muted-foreground/60">
        {lastImpact && <span className="animate-float-in">{lastImpact}</span>}

        {entityState === "review-ready" && (
          <button
            onClick={handleReviewClick}
            className="text-primary/80 hover:text-primary transition-colors tracking-wide"
          >
            Review öffnen
          </button>
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
