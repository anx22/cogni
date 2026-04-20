import { useCallback, useState } from "react";
import { demoProject } from "@/data/demoProject";
import LageZone from "./LageZone";
import HandlungsbedarfList from "./HandlungsbedarfList";
import VerlaufFeed from "./VerlaufFeed";
import SubstanzSection from "./SubstanzSection";
import { useIntake } from "@/lib/intake/useIntake";
import { detectFromDrop } from "@/lib/intake/detectInputType";

interface ProjectScreenProps {
  onBack: () => void;
  /**
   * Echte Projekt-UUID aus der DB. Wenn gesetzt, werden alle Drops
   * direkt an dieses Projekt gehängt → keine Zuordnungsbox im Dialog.
   */
  projectId?: string | null;
}

const isUuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

const ProjectScreen = ({ onBack, projectId }: ProjectScreenProps) => {
  const p = demoProject;
  const [dragActive, setDragActive] = useState(false);

  // Nur wenn echte UUID → an useIntake durchreichen. Demo-IDs („demo-1")
  // werden bewusst ignoriert, damit der Lauf normal über die Zuordnungsbox geht.
  const realProjectId = isUuid(projectId) ? projectId : null;
  const { intake } = useIntake({ projectId: realProjectId });

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Nur wenn wir den Container wirklich verlassen
    if (e.currentTarget === e.target) setDragActive(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const files = Array.from(e.dataTransfer.files ?? []);
      if (files.length === 0) return;
      intake(detectFromDrop(files));
    },
    [intake],
  );

  return (
    <div
      className="min-h-screen bg-surface-0 animate-[fade-in_0.5s_ease-out] relative"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
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
            <VerlaufFeed verlauf={p.verlauf} />
          </div>
          <div className="lg:col-span-2 min-w-0">
            <HandlungsbedarfList items={p.handlungsbedarf} />
          </div>
        </div>
      </section>

      <SubstanzSection themen={p.themen} dokumente={p.dokumente} />

      {/* Drop-Overlay — nur sichtbar während Drag, nimmt nur dann Events */}
      {dragActive && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-background/60 backdrop-blur-sm pointer-events-none transition-opacity"
          aria-hidden
        >
          <div className="border-2 border-dashed border-primary/60 rounded-2xl px-12 py-10 bg-surface-1/80">
            <p className="text-2xl font-light tracking-wide text-foreground/90">
              {realProjectId
                ? `Ablegen für „${p.name}"`
                : "Ablegen — Zuordnung im Dialog"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground/70 tracking-wide">
              {realProjectId
                ? "Ich hänge es direkt an dieses Projekt."
                : "Ich frage dich gleich, wohin es gehört."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectScreen;
