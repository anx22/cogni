// =============================================================================
//  MobileNavSheet — Sheet-basierte Navigation für unter-lg Viewports.
//  Bündelt Projekte (SideGrid) + Intake-Liste in einem Drawer von links.
// =============================================================================
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import SideGrid from "./SideGrid";
import IntakeSessionsPanel from "./IntakeSessionsPanel";
import type { DemoProject } from "@/data/demoProjects";

interface Props {
  projects: DemoProject[];
  projectsError?: string | null;
  onReloadProjects?: () => void;
  onProjectClick: (id: string) => void;
  onCreateProject: () => void;
}

const MobileNavSheet = ({
  projects,
  projectsError,
  onReloadProjects,
  onProjectClick,
  onCreateProject,
}: Props) => {
  const [open, setOpen] = useState(false);

  const handleProject = (id: string) => {
    setOpen(false);
    onProjectClick(id);
  };

  const handleCreate = () => {
    setOpen(false);
    onCreateProject();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Navigation öffnen"
          className="lg:hidden fixed top-6 left-6 z-30 p-2 rounded-full bg-[hsl(var(--surface-1)/0.6)] backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="bg-background border-border-subtle overflow-y-auto w-[min(92vw,420px)]"
      >
        <SheetTitle className="sr-only">Projekte und Intake</SheetTitle>
        <div className="flex flex-col items-center gap-8 pt-8">
          <SideGrid
            side="left"
            label="Projekte"
            projects={projects}
            onProjectClick={handleProject}
            onCreateProject={handleCreate}
            error={projectsError}
            onRetry={onReloadProjects}
          />
          <IntakeSessionsPanel />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavSheet;
