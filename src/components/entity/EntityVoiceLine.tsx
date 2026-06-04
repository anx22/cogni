// =============================================================================
//  EntityVoiceLine — die "Stimme" der Intelligenz unter dem Kern.
// -----------------------------------------------------------------------------
//  Großer, dünner Text, schwebt mittig. Soft-Fade zwischen Sätzen.
//  tone="working" → warmes Amber, damit das Denken auch sprachlich heiß wirkt.
//  Quelle: useEntity().utterance (dritte Säule, EIN Signal-Stream) — keine
//  eigene Subscription mehr.
// =============================================================================

import { useEffect, useState } from "react";
import { RotateCw } from "lucide-react";
import { useEntity, type Utterance } from "@/lib/entity";

interface Props {
  onRetry?: (assetId: string) => void;
  /** Kompakt für schmale Flächen (EntityRail): kleiner Text, umbruchfähig. */
  compact?: boolean;
}

const EMPTY: Utterance = { text: "", tone: "calm" };

const EntityVoiceLine = ({ onRetry, compact = false }: Props) => {
  const { utterance } = useEntity();
  const [shown, setShown] = useState<Utterance>(utterance ?? EMPTY);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const next = utterance ?? EMPTY;
    if (next.text === shown.text) return;
    setVisible(false);
    const t = setTimeout(() => {
      setShown(next);
      setVisible(true);
    }, 200);
    return () => clearTimeout(t);
  }, [utterance, shown.text]);

  if (!shown.text) return null;

  const toneColor =
    shown.tone === "alert"
      ? "text-destructive/80"
      : shown.tone === "ready"
        ? "text-primary/80"
        : shown.tone === "working"
          ? "text-amber-300/90"
          : "text-muted-foreground/70";

  return (
    <div
      className={`flex items-center gap-2 transition-all duration-200 ${
        compact ? "justify-center text-center" : "gap-3"
      } ${visible ? "opacity-100 blur-0" : "opacity-0 blur-sm"}`}
    >
      <p
        className={
          compact
            ? `text-sm font-normal leading-snug ${toneColor}`
            : `text-2xl font-light tracking-wide ${toneColor}`
        }
        style={{ textShadow: "0 0 40px hsl(var(--background))" }}
      >
        {shown.text}
      </p>
      {shown.retryAssetId && onRetry && (
        <button
          onClick={() => onRetry(shown.retryAssetId!)}
          className="p-2 rounded-full text-muted-foreground/50 hover:text-primary hover:bg-surface-2/50 transition-colors"
          aria-label="Nochmal versuchen"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default EntityVoiceLine;
