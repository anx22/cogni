// =============================================================================
//  HomeDropOverlay — erscheint NUR während eines aktiven Drags.
//  Kein Busy-Vollblocker mehr. Ohne Drag = nicht im DOM.
// =============================================================================

interface Props {
  active: boolean;
  busy: boolean;
}

const HomeDropOverlay = ({ active, busy }: Props) => {
  if (!active) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-background/60 backdrop-blur-sm pointer-events-none transition-opacity"
      aria-hidden
    >
      <div
        className={`px-16 py-12 rounded-3xl border-2 border-dashed ${
          busy ? "border-amber-400/60 bg-amber-400/5" : "border-primary/50 bg-surface-1/40"
        }`}
      >
        <p
          className={`text-4xl md:text-5xl font-light tracking-tight ${
            busy ? "text-amber-300/90" : "text-foreground/95"
          }`}
        >
          {busy ? "Noch beschäftigt." : "Lass los — ich höre zu."}
        </p>
        <p className="mt-3 text-base md:text-lg text-muted-foreground/70 tracking-wide font-light">
          {busy ? "Warte kurz, dann gerne." : "Datei, Link oder Notiz."}
        </p>
      </div>
    </div>
  );
};

export default HomeDropOverlay;
