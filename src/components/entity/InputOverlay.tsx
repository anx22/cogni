import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { X, Paperclip } from "lucide-react";
import InputPills, { type InputMode } from "./InputPills";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  detectFromPaste,
  detectFromText,
  detectFromDrop,
  isUrl,
  type IntakePayload,
} from "@/lib/intake/detectInputType";

interface InputOverlayProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: IntakePayload) => void;
}

const InputOverlay = ({ open, onClose, onSubmit }: InputOverlayProps) => {
  const [mode, setMode] = useState<InputMode>("note");
  const [noteText, setNoteText] = useState("");
  const [linkText, setLinkText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setMode("note");
      setNoteText("");
      setLinkText("");
    } else {
      // autofocus on open
      window.setTimeout(() => noteRef.current?.focus(), 50);
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleVoice = useCallback(() => {
    toast("Sprachaufnahme kommt bald", { description: "Phase 6" });
  }, []);

  useEffect(() => {
    if (mode === "voice") handleVoice();
  }, [mode, handleVoice]);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-2xl animate-float-in"
      onClick={onClose}
      onPaste={handlePaste}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-6 right-6 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        aria-label="Schließen"
      >
        <X className="size-5" />
      </button>

      <div
        className="w-full max-w-2xl px-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-8 flex justify-center">
          <InputPills active={mode} onChange={setMode} />
        </div>

        {mode === "note" && (
          <div className="space-y-4">
            <Textarea
              ref={noteRef}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={handleNoteKey}
              placeholder="Notiz, Gedanke, gepasteter Text…"
              className="min-h-[220px] resize-none border-border/30 bg-background/40 text-base leading-relaxed focus-visible:ring-primary/30"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground/50 tracking-wide">
                ⌘/Ctrl + Enter zum Übernehmen
              </span>
              <Button
                onClick={submitNote}
                disabled={!noteText.trim()}
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
              >
                Übernehmen
              </Button>
            </div>
          </div>
        )}

        {mode === "link" && (
          <div className="space-y-4">
            <Input
              autoFocus
              type="url"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              onKeyDown={handleLinkKey}
              placeholder="https://…"
              className="h-14 border-border/30 bg-background/40 text-base focus-visible:ring-primary/30"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground/50 tracking-wide">
                Enter zum Übernehmen
              </span>
              <Button
                onClick={submitLink}
                disabled={!linkText.trim()}
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
              >
                Übernehmen
              </Button>
            </div>
          </div>
        )}

        {mode === "file" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border/40 bg-background/30 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Paperclip className="size-6 opacity-60" />
              <span className="text-sm tracking-wide">Datei auswählen</span>
              <span className="text-xs opacity-50">PDF, DOCX, PPTX, Bilder, EML</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => submitFiles(Array.from(e.target.files ?? []))}
            />
            <p className="text-center text-xs text-muted-foreground/40 tracking-wide">
              Drag & Drop funktioniert auch direkt auf dem Kern.
            </p>
          </div>
        )}

        {mode === "voice" && (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border/30 bg-background/20 text-muted-foreground/60">
            <span className="text-sm tracking-wide">Sprachaufnahme kommt in Phase 6</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputOverlay;
