// =============================================================================
//  AtmosphereStripe — dünner Streifen oben im Projekt-Screen.
//  Spiegelt den Lebenszustand des Projekts (idle / review-warm).
//  Bewusst lautlos: keine Logik-Verschiebung, nur visuelle Kontinuität
//  zwischen Entität (Pipeline) und Projekt-Detail.
// =============================================================================
import type { ProjectViewModel } from "@/lib/project/types";

interface AtmosphereStripeProps {
  project?: ProjectViewModel | null;
}

const AtmosphereStripe = ({ project }: AtmosphereStripeProps) => {
  const offen = project?.handlungsbedarf?.length ?? 0;
  const konflikte =
    project?.handlungsbedarf?.filter((h) => h.objektTyp === "konflikt").length ?? 0;
  const active = offen > 0 || konflikte > 0;

  return (
    <div
      className={`atmosphere-stripe pointer-events-none${active ? " is-active" : ""}`}
      aria-hidden
      style={{ zIndex: 20 }}
    />
  );
};

export default AtmosphereStripe;
