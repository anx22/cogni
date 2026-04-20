// =============================================================================
//  EntityVoice — die "Stimme" der Intelligenz unter dem Kern.
// -----------------------------------------------------------------------------
//  Großer, dünner Text, schwebt mittig. Soft-Fade zwischen Sätzen.
//  tone="working" → warmes Amber, damit das Denken auch sprachlich heiß wirkt.
// =============================================================================

import { useEffect, useState } from "react";
import { RotateCw } from "lucide-react";
import type { VoiceState } from "@/lib/voice/useEntityVoice";

interface Props {
  voice: VoiceState;
  onRetry?: (assetId: string) => void;
}

const EntityVoice = ({ voice, onRetry }: Props) => {
  const [shown, setShown] = useState<VoiceState>(voice);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (voice.text === shown.text) return;
    setVisible(false);
    const t = setTimeout(() => {
      setShown(voice);
      setVisible(true);
    }, 200);
    return () => clearTimeout(t);
  }, [voice, shown.text]);

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
      className={`flex items-center gap-3 transition-all duration-200 ${
        visible ? "opacity-100 blur-0" : "opacity-0 blur-sm"
      }`}
    >
      <p
        className={`text-2xl font-light tracking-wide ${toneColor}`}
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

export default EntityVoice;
