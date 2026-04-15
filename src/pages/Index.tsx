import { useState, useCallback } from "react";
import EntityCore from "@/components/EntityCore";
import ProjectScreen from "@/components/project/ProjectScreen";

type EntityState = "idle" | "hover" | "processing" | "review-ready" | "failed";
type AppView = "entity" | "project";

const Index = () => {
  const [entityState, setEntityState] = useState<EntityState>("idle");
  const [lastImpact, setLastImpact] = useState<string | null>(null);
  const [droppedFiles, setDroppedFiles] = useState<string[]>([]);
  const [view, setView] = useState<AppView>("entity");

  const handleDrop = useCallback((files: File[]) => {
    const names = files.map(f => f.name);
    setDroppedFiles(prev => [...prev, ...names]);
    setEntityState("processing");
    setLastImpact(`${files.length} ${files.length === 1 ? "Objekt" : "Objekte"} aufgenommen`);
  }, []);

  const handleReviewClick = useCallback(() => {
    console.log("Review triggered");
  }, []);

  if (view === "project") {
    return <ProjectScreen onBack={() => setView("entity")} />;
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-background">
      {/* Entity Core — center */}
      <div className="relative w-full flex-1 flex items-center justify-center">
        <EntityCore
          state={entityState}
          onDrop={handleDrop}
          onReviewClick={handleReviewClick}
        />

        {/* Input hint */}
        <p className="absolute bottom-[18%] text-muted-foreground text-sm tracking-wide opacity-60 animate-float-in">
          Mail, PDF, PPTX, DOCX, Bilder oder Notizen hier ablegen
        </p>
      </div>

      {/* Bottom bar — minimal status */}
      <div className="absolute bottom-8 flex items-center gap-8 text-xs text-muted-foreground/60">
        {lastImpact && (
          <span className="animate-float-in">{lastImpact}</span>
        )}

        {entityState === "review-ready" && (
          <button
            onClick={handleReviewClick}
            className="text-primary/80 hover:text-primary transition-colors tracking-wide"
          >
            Review öffnen
          </button>
        )}

        {droppedFiles.length > 0 && (
          <span className="opacity-40">
            {droppedFiles.length} {droppedFiles.length === 1 ? "Asset" : "Assets"}
          </span>
        )}
      </div>

      {/* Project access — very subtle, top right */}
      <button
        className="absolute top-6 right-6 text-xs text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors tracking-widest uppercase"
        onClick={() => setView("project")}
      >
        Projekte
      </button>
    </div>
  );
};

export default Index;
