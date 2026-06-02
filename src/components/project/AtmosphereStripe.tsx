// =============================================================================
//  AtmosphereStripe — dünner Streifen oben im Projekt-Screen.
//  Spiegelt den Lebenszustand des Projekts (idle / review-warm).
//  Bewusst lautlos: keine Logik-Verschiebung, nur visuelle Kontinuität
//  zwischen Entität (Pipeline) und Projekt-Detail.
// =============================================================================
import type { ProjectViewModel } from "@/lib/project/types";

interface AtmosphereStripeProps {
  project?: ProjectViewModel | null;
  isProcessing?: boolean;
}

const AtmosphereStripe = ({ project, isProcessing }: AtmosphereStripeProps) => {
  const offen = project?.handlungsbedarf?.length ?? 0;
  const konflikte = project?.handlungsbedarf?.filter((h) => h.objektTyp === "konflikt").length ?? 0;
  const active = offen > 0 || konflikte > 0;

  const cls = [
    "atmosphere-stripe pointer-events-none",
    isProcessing ? "is-processing" : active ? "is-active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={cls} aria-hidden style={{ zIndex: 20 }} />;
};

export default AtmosphereStripe;
