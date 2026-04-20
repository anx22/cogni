// =============================================================================
//  HomeDropOverlay — schwebender Hinweistext, KEIN Vollflächen-Blocker.
//  Zeigt sich nur, solange ein echter Drag läuft. Während busy: nur Hinweis,
//  keine Maskierung der UI.
// =============================================================================

interface Props {
  active: boolean;
  busy: boolean;
}

const HomeDropOverlay = ({ active, busy }: Props) => {
  if (!active) return null;

  const headline = busy ? "Noch beschäftigt — gleich wieder." : "Lass los — ich höre zu.";
  const subline = busy ? null : "Datei, Link oder Notiz.";

  return (
    <div
      className="fixed top-12 left-1/2 -translate-x-1/2 z-40 pointer-events-none text-center animate-float-in"
      aria-hidden
    >
      <p
        className="text-3xl md:text-4xl font-light tracking-tight text-foreground/95"
        style={{ textShadow: "0 2px 24px hsl(var(--background) / 0.8)" }}
      >
        {headline}
      </p>
      {subline && (
        <p
          className="mt-1.5 text-sm md:text-base text-muted-foreground/70 tracking-wide font-light"
          style={{ textShadow: "0 2px 16px hsl(var(--background) / 0.8)" }}
        >
          {subline}
        </p>
      )}
    </div>
  );
};

export default HomeDropOverlay;
