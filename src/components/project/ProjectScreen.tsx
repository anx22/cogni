import { demoProject } from "@/data/demoProject";
import LageZone from "./LageZone";
import HandlungsbedarfList from "./HandlungsbedarfList";
import VerlaufFeed from "./VerlaufFeed";
import SubstanzSection from "./SubstanzSection";

interface ProjectScreenProps {
  onBack: () => void;
}

const ProjectScreen = ({ onBack }: ProjectScreenProps) => {
  const p = demoProject;

  return (
    <div className="min-h-screen bg-background animate-[fade-in_0.5s_ease-out]">
      <button
        onClick={onBack}
        className="fixed top-6 left-8 z-50 text-xs text-muted-foreground/40 hover:text-muted-foreground/80 transition-colors tracking-widest uppercase"
      >
        ← Entität
      </button>

      <LageZone project={p} />
      <HandlungsbedarfList items={p.handlungsbedarf} />
      <VerlaufFeed verlauf={p.verlauf} />
      <SubstanzSection themen={p.themen} dokumente={p.dokumente} />
    </div>
  );
};

export default ProjectScreen;
