// =============================================================================
//  InlineComposer — inline statt Fullscreen.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { X, Paperclip, Mic, Square, Loader2 } from "lucide-react";
import InputPills, { type InputMode } from "./InputPills";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  detectFromPaste,
  detectFromText,
  detectFromDrop,
  isUrl,
  type IntakePayload,
} from "@/lib/intake/detectInputType";
import { useVoiceRecorder } from "@/lib/voice/useVoiceRecorder";

interface InputOverlayProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: IntakePayload) => void;
  className?: string;
  /** Kurzer Kontextsatz oben im Composer, z.B. "Wird global aufgenommen". */
  contextHint?: string;
}

const InputOverlay = ({ open, onClose, onSubmit, className, contextHint }: InputOverlayProps) => {
  const [mode, setMode] = useState<InputMode>("note");
  const [noteText, setNoteText] = useState("");
  const [linkText, setLinkText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const voice = useVoiceRecorder();

  useEffect(() => {
    if (!open) {
      setMode("note");
      setNoteText("");
      setLinkText("");
      voice.cancel();
    } else {
      window.setTimeout(() => noteRef.current?.focus(), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const submitNote = useCallback(() => {
    const value = noteText.trim();
    if (!value) return;
    onSubmit(detectFromText(value));
    onClose();
  }, [noteText, onSubmit, onClose]);

  const submitLink = useCallback(() => {
    const value = linkText.trim();
    if (!value) return;
    if (!isUrl(value)) {
      toast.error("Keine gültige URL");
      return;
    }
    onSubmit({ type: "url", url: value, label: "Link" });
    onClose();
  }, [linkText, onSubmit, onClose]);

  const submitFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      onSubmit(detectFromDrop(files));
      onClose();
    },
    [onSubmit, onClose],
  );

  const submitVoice = useCallback(() => {
    if (!voice.transcript) return;
    onSubmit(detectFromText(voice.transcript));
    voice.reset();
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.transcript, onSubmit, onClose, voice.reset]);

  const handleNoteKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submitNote();
    }
  };

  const handleLinkKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitLink();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const detected = detectFromPaste(e);
    if (detected?.type === "file") {
      e.preventDefault();
      onSubmit(detected);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className={cn(
        "relative w-full max-w-xl rounded-2xl border border-border/20 bg-[hsl(var(--surface-1)/0.6)] backdrop-blur-md p-5 animate-float-in shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)]",
        className,
      )}
      onPaste={handlePaste}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        aria-label="Schließen"
      >
        <X className="size-4" />
      </button>

      {contextHint && (
        <p className="mb-3 text-center text-[11px] text-muted-foreground/60 tracking-wide">
          {contextHint}
        </p>
      )}

      <div className="mb-4 flex justify-center">
        <InputPills active={mode} onChange={setMode} />
      </div>

      {mode === "note" && (
        <div className="space-y-3">
          <Textarea
            ref={noteRef}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={handleNoteKey}
            placeholder="Notiz, Gedanke, gepasteter Text…"
            className="min-h-[140px] resize-none border-border/30 bg-background/40 text-sm leading-relaxed focus-visible:ring-primary/30"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground/50 tracking-wide">
              ⌘/Ctrl + Enter zum Übernehmen
            </span>
            <Button
              onClick={submitNote}
              disabled={!noteText.trim()}
              variant="outline"
              size="sm"
              className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
            >
              Übernehmen
            </Button>
          </div>
        </div>
      )}

      {mode === "link" && (
        <div className="space-y-3">
          <Input
            autoFocus
            type="url"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            onKeyDown={handleLinkKey}
            placeholder="https://…"
            className="h-12 border-border/30 bg-background/40 text-sm focus-visible:ring-primary/30"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground/50 tracking-wide">
              Enter zum Übernehmen
            </span>
            <Button
              onClick={submitLink}
              disabled={!linkText.trim()}
              variant="outline"
              size="sm"
              className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
            >
              Übernehmen
            </Button>
          </div>
        </div>
      )}

      {mode === "file" && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border/40 bg-background/30 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Paperclip className="size-5 opacity-60" />
            <span className="text-sm tracking-wide">Datei auswählen</span>
            <span className="text-[11px] opacity-50">PDF, DOCX, PPTX, Bilder, EML</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => submitFiles(Array.from(e.target.files ?? []))}
          />
          <p className="text-center text-[11px] text-muted-foreground/40 tracking-wide">
            Drag & Drop funktioniert auch direkt auf dem Kern.
          </p>
        </div>
      )}

      {mode === "voice" && (
        <div className="flex min-h-[140px] flex-col items-center justify-center gap-4 rounded-md border border-dashed border-border/30 bg-background/20">
          {voice.status === "idle" && (
            <button
              type="button"
              onClick={voice.start}
              className="flex flex-col items-center gap-3 text-muted-foreground/70 hover:text-primary transition-colors"
            >
              <div className="w-14 h-14 rounded-full border-2 border-current flex items-center justify-center hover:scale-105 transition-transform">
                <Mic className="size-6" />
              </div>
              <span className="text-xs tracking-wide">Aufnahme starten</span>
            </button>
          )}

          {voice.status === "recording" && (
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={voice.stop}
                className="flex flex-col items-center gap-3 text-destructive hover:text-destructive/80 transition-colors"
              >
                <div className="w-14 h-14 rounded-full border-2 border-current flex items-center justify-center animate-pulse">
                  <Square className="size-5" />
                </div>
                <span className="text-xs tracking-wide">Aufnahme stoppen</span>
              </button>
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-primary/60 rounded-full animate-pulse"
                    style={{
                      height: `${12 + Math.random() * 16}px`,
                      animationDelay: `${i * 150}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {voice.status === "transcribing" && (
            <div className="flex flex-col items-center gap-3 text-muted-foreground/60">
              <Loader2 className="size-8 animate-spin" />
              <span className="text-xs tracking-wide">Transkribiere…</span>
            </div>
          )}

          {voice.status === "done" && voice.transcript && (
            <div className="w-full space-y-3 px-4">
              <p className="text-sm text-foreground/90 leading-relaxed bg-background/40 rounded-lg p-3 border border-border/20">
                {voice.transcript}
              </p>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={voice.reset}
                  className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors tracking-wide"
                >
                  Nochmal
                </button>
                <Button
                  onClick={submitVoice}
                  variant="outline"
                  size="sm"
                  className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                >
                  Übernehmen
                </Button>
              </div>
            </div>
          )}

          {voice.status === "error" && (
            <div className="flex flex-col items-center gap-3 text-destructive/80">
              <p className="text-xs tracking-wide">{voice.error ?? "Fehler bei der Aufnahme"}</p>
              <button
                type="button"
                onClick={voice.reset}
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

export default InputOverlay;
