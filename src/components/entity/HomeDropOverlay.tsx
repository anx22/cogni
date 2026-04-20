// =============================================================================
//  HomeDropOverlay — nur für echten aktiven Drag im Idle-Zustand.
//  Während busy kein Fullscreen-Blocker mehr.
// =============================================================================

interface Props {
  active: boolean;
  busy: boolean;
}

const HomeDropOverlay = ({ active, busy }: Props) => {
  if (!active || busy) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-background/60 backdrop-blur-sm pointer-events-none transition-opacity"
      aria-hidden
    >
      <div className="px-16 py-12 rounded-3xl border-2 border-dashed border-primary/50 bg-surface-1/40">
        <p className="text-4xl md:text-5xl font-light tracking-tight text-foreground/95">
          Lass los — ich höre zu.
        </p>
        <p className="mt-3 text-base md:text-lg text-muted-foreground/70 tracking-wide font-light">
          Datei, Link oder Notiz.
        </p>
      </div>
    </div>
  );
};

export default HomeDropOverlay;
