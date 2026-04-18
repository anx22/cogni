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
    <div className="min-h-screen bg-surface-0 animate-[fade-in_0.5s_ease-out]">
      <button
        onClick={onBack}
        className="fixed top-6 left-8 z-50 text-xs text-muted-foreground/60 hover:text-foreground/90 transition-colors tracking-widest uppercase"
      >
        ← Entität
      </button>

      <LageZone project={p} />

      {/* Operativer Mittelteil — zweispaltig 60/40 ab lg */}
      <section className="px-8 md:px-12 lg:px-16 xl:px-20 py-16 bg-surface-1 border-b border-border-strong">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 min-w-0">
            <HandlungsbedarfList items={p.handlungsbedarf} />
          </div>
          <div className="lg:col-span-2 min-w-0">
            <VerlaufFeed verlauf={p.verlauf} />
          </div>
        </div>
      </section>

      <SubstanzSection themen={p.themen} dokumente={p.dokumente} />
    </div>
  );
};

export default ProjectScreen;
