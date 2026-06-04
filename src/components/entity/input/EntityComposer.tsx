// =============================================================================
//  EntityComposer — Unified Composer (Phase 5).
//  Ruhende Leiste, die bei Fokus morpht. EINE Eingabefläche ersetzt
//  HomePrompt + InputOverlay + FacePill-2×2. Auto-Detect Text↔Link;
//  Datei/Sprache als explizite Affordanzen. Orb-optional (Home mit Feedback,
//  ProjectScreen-Rail reagiert mit). Spec: docs/entity-core.md §Composer.
// =============================================================================

import { Paperclip, Mic, Square, Loader2, X, ArrowUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { IntakePayload } from "@/lib/intake/detectInputType";
import { useComposer } from "./useComposer";
import "./composerTokens.css";

interface EntityComposerProps {
  onSubmit: (payload: IntakePayload) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contextHint?: string;
  className?: string;
  /** false auf Screens ohne zentralen Orb (ProjectScreen). */
  signalOrb?: boolean;
  /** Bei Blur-auf-leer zuklappen (Home: true; Modal: false). */
  collapseOnBlur?: boolean;
}

const EntityComposer = ({
  onSubmit,
  open,
  onOpenChange,
  contextHint,
  className,
  signalOrb,
  collapseOnBlur,
}: EntityComposerProps) => {
  const c = useComposer({ onSubmit, open, onOpenChange, signalOrb, collapseOnBlur });

  // --- Ruhende Leiste --------------------------------------------------------
  if (!c.open) {
    return (
      <div className={cn("w-full max-w-xl", className)}>
        <div className="flex items-center gap-2 rounded-full border border-border/25 bg-[hsl(var(--surface-1)/0.5)] backdrop-blur-md px-4 py-3 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.6)]">
          <button
            type="button"
            onClick={c.openComposer}
            className="flex-1 text-left text-sm text-muted-foreground/60 tracking-wide"
          >
            Schreib, füg ein oder zieh rein…
          </button>
          <button
            type="button"
            onClick={() => {
              c.openComposer();
              c.setMode("file");
            }}
            className="text-muted-foreground/50 hover:text-primary transition-colors"
            aria-label="Datei"
          >
            <Paperclip className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              c.openComposer();
              c.setMode("voice");
            }}
            className="text-muted-foreground/50 hover:text-primary transition-colors"
            aria-label="Sprache"
          >
            <Mic className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  // --- Gemorpht (offen) ------------------------------------------------------
  return (
    <div
      className={cn(
        "entity-composer-morph relative w-full max-w-xl rounded-2xl border border-border/20 bg-[hsl(var(--surface-1)/0.6)] backdrop-blur-md p-5 animate-float-in shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)]",
        className,
      )}
      onPaste={c.handleRootPaste}
    >
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => c.setMode("file")}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            c.mode === "file"
              ? "text-primary bg-primary/10"
              : "text-muted-foreground/40 hover:text-muted-foreground",
          )}
          aria-label="Datei"
        >
          <Paperclip className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => c.setMode("voice")}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            c.mode === "voice"
              ? "text-primary bg-primary/10"
              : "text-muted-foreground/40 hover:text-muted-foreground",
          )}
          aria-label="Sprache"
        >
          <Mic className="size-4" />
        </button>
        <button
          type="button"
          onClick={c.closeComposer}
          className="p-1.5 rounded-md text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          aria-label="Schließen"
        >
          <X className="size-4" />
        </button>
      </div>

      {contextHint && (
        <p className="mb-3 pr-24 text-[11px] text-muted-foreground/60 tracking-wide">
          {contextHint}
        </p>
      )}

      {c.mode === "text" && (
        <div className="space-y-3">
          {c.pastePreview ? (
            <>
              <div className="rounded-lg border border-border/30 bg-background/40 p-3 max-h-[140px] overflow-y-auto text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {c.text}
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => c.setPastePreview(false)}
                  className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors tracking-wide"
                >
                  Bearbeiten
                </button>
                <Button
                  onClick={c.submitText}
                  size="sm"
                  className="gap-1.5 bg-primary/90 hover:bg-primary text-primary-foreground"
                >
                  <ArrowUp className="size-3.5" /> Senden
                </Button>
              </div>
            </>
          ) : (
            <>
              <Textarea
                ref={c.textRef}
                value={c.text}
                onChange={(e) => c.setText(e.target.value)}
                onKeyDown={c.handleTextKey}
                onPaste={c.handleTextareaPaste}
                onBlur={c.collapseIfEmpty}
                placeholder="Notiz, Gedanke, Link, gepasteter Text…"
                className="min-h-[120px] resize-none border-border/30 bg-background/40 text-sm leading-relaxed focus-visible:ring-primary/30"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground/50 tracking-wide">
                  Link wird automatisch erkannt · ⌘/Ctrl + Enter sendet
                </span>
                <Button
                  onClick={c.submitText}
                  disabled={!c.text.trim()}
                  size="sm"
                  className="gap-1.5 bg-primary/90 hover:bg-primary text-primary-foreground"
                >
                  <ArrowUp className="size-3.5" /> Senden
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {c.mode === "file" && (
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => c.fileInputRef.current?.click()}
            className="flex min-h-[120px] w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border/40 bg-background/30 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Paperclip className="size-5 opacity-60" />
            <span className="text-sm tracking-wide">Datei auswählen</span>
            <span className="text-[11px] opacity-50">PDF, DOCX, PPTX, Bilder, EML</span>
          </button>
          <input
            ref={c.fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => c.submitFiles(Array.from(e.target.files ?? []))}
          />
          <p className="text-center text-[11px] text-muted-foreground/40 tracking-wide">
            Drag & Drop funktioniert auch direkt auf dem Kern.
          </p>
        </div>
      )}

      {c.mode === "voice" && (
        <div className="flex min-h-[120px] flex-col items-center justify-center gap-4 rounded-md border border-dashed border-border/30 bg-background/20 pt-2">
          {c.voice.status === "idle" && (
            <button
              type="button"
              onClick={c.voice.start}
              className="flex flex-col items-center gap-3 text-muted-foreground/70 hover:text-primary transition-colors"
            >
              <div className="w-14 h-14 rounded-full border-2 border-current flex items-center justify-center hover:scale-105 transition-transform">
                <Mic className="size-6" />
              </div>
              <span className="text-xs tracking-wide">Aufnahme starten</span>
            </button>
          )}

          {c.voice.status === "recording" && (
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={c.voice.stop}
                className="flex flex-col items-center gap-3 text-destructive hover:text-destructive/80 transition-colors"
              >
                <div className="w-14 h-14 rounded-full border-2 border-current flex items-center justify-center animate-pulse">
                  <Square className="size-5" />
                </div>
                <span className="text-xs tracking-wide">Aufnahme stoppen</span>
              </button>
              <div className="flex items-end gap-1.5 h-7">
                {c.voice.levels.map((lvl, i) => (
                  <div
                    key={i}
                    className="w-1 bg-primary/70 rounded-full transition-[height] duration-75"
                    style={{ height: `${4 + lvl * 24}px`, opacity: 0.4 + lvl * 0.6 }}
                  />
                ))}
              </div>
            </div>
          )}

          {c.voice.status === "transcribing" && (
            <div className="flex flex-col items-center gap-3 text-muted-foreground/60">
              <Loader2 className="size-8 animate-spin" />
              <span className="text-xs tracking-wide">Transkribiere…</span>
            </div>
          )}

          {c.voice.status === "done" && c.voice.transcript && (
            <div className="w-full space-y-3 px-4">
              <p className="text-sm text-foreground/90 leading-relaxed bg-background/40 rounded-lg p-3 border border-border/20">
                {c.voice.transcript}
              </p>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={c.voice.reset}
                  className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors tracking-wide"
                >
                  Nochmal
                </button>
                <Button
                  onClick={c.submitVoice}
                  size="sm"
                  className="gap-1.5 bg-primary/90 hover:bg-primary text-primary-foreground"
                >
                  <ArrowUp className="size-3.5" /> Senden
                </Button>
              </div>
            </div>
          )}

          {c.voice.status === "error" && (
            <div className="flex flex-col items-center gap-3 text-destructive/80">
              <p className="text-xs tracking-wide">{c.voice.error ?? "Fehler bei der Aufnahme"}</p>
              <button
                type="button"
                onClick={c.voice.reset}
                className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors underline"
              >
                Nochmal versuchen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EntityComposer;
