import { useState, useCallback } from "react";
import EntityCore from "@/components/EntityCore";
import ProjectScreen from "@/components/project/ProjectScreen";
import SideGrid from "@/components/entity/SideGrid";
import InputOverlay from "@/components/entity/InputOverlay";
import { demoProjects } from "@/data/demoProjects";
import { useIntake } from "@/lib/intake/useIntake";
import { detectFromDrop } from "@/lib/intake/detectInputType";

type EntityState = "idle" | "hover" | "processing" | "review-ready" | "failed";
type AppView = "entity" | "project";

const Index = () => {
  const [entityState, setEntityState] = useState<EntityState>("idle");
  const [lastImpact, setLastImpact] = useState<string | null>(null);
  const [view, setView] = useState<AppView>("entity");
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>();
  const [overlayOpen, setOverlayOpen] = useState(false);

  const { intake } = useIntake({ setEntityState, setLastImpact });

  const isDragActive = entityState === "hover";

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
          <SideGrid side="right" isDragActive={isDragActive} />
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

      <button
        className="absolute top-6 right-6 text-xs text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors tracking-widest uppercase"
        onClick={() => setView("project")}
      >
        Projekte
      </button>

      <InputOverlay
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        onSubmit={intake}
      />
    </div>
  );
};

export default Index;
