// =============================================================================
//  useComposer — State + Submit-Logik des Unified Composer.
//  Treibt Achse 2 (controller.interact) bei Fokus/Modus-Wahl, damit der Orb
//  reagiert. Migriert die InputOverlay-Features (Paste-Preview, Voice, File-
//  Partition, Auto-Detect Text↔Link).
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  detectFromPaste,
  detectFromText,
  detectFromDrop,
  type IntakePayload,
} from "@/lib/intake/detectInputType";
import { partitionFiles } from "@/lib/intake/supportedFileTypes";
import { useVoiceRecorder } from "@/lib/voice/useVoiceRecorder";
import { useEntity } from "@/lib/entity";

/** Sichtbarer Composer-Modus. „text" deckt Notiz + Link ab (Auto-Detect bei Submit). */
export type ComposerMode = "text" | "file" | "voice";

interface UseComposerOptions {
  onSubmit: (payload: IntakePayload) => void;
  /** Kontrolliertes Offen/Zu — erlaubt Orb als Zweit-Einstieg. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Orb-Feedback senden (Home true; ProjectScreen-Rail reagiert ebenfalls). */
  signalOrb?: boolean;
  /** Bei Blur-auf-leer zuklappen (Home: true; Modal/ProjectScreen: false). */
  collapseOnBlur?: boolean;
}

export function useComposer({
  onSubmit,
  open,
  onOpenChange,
  signalOrb = true,
  collapseOnBlur = true,
}: UseComposerOptions) {
  const { controller } = useEntity();
  const [mode, setModeState] = useState<ComposerMode>("text");
  const [text, setText] = useState("");
  const [pastePreview, setPastePreview] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voice = useVoiceRecorder();

  const interact = useCallback(
    (action: Parameters<typeof controller.interact>[0]) => {
      if (signalOrb) controller.interact(action);
    },
    [controller, signalOrb],
  );

  const openComposer = useCallback(() => {
    onOpenChange(true);
    interact({ kind: "pick", mode: "note" });
    window.setTimeout(() => textRef.current?.focus(), 30);
  }, [onOpenChange, interact]);

  const reset = useCallback(() => {
    setModeState("text");
    setText("");
    setPastePreview(false);
    voice.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.cancel]);

  const closeComposer = useCallback(() => {
    onOpenChange(false);
    reset();
    interact({ kind: "close" });
  }, [onOpenChange, interact, reset]);

  /** Zuklappen nur bei leer (Spec: Blur-bei-leer, sonst offen, kein Timeout). */
  const collapseIfEmpty = useCallback(() => {
    if (!collapseOnBlur) return;
    if (mode === "text" && !text.trim() && !pastePreview) closeComposer();
  }, [collapseOnBlur, mode, text, pastePreview, closeComposer]);

  const setMode = useCallback(
    (next: ComposerMode) => {
      setModeState(next);
      const picked = next === "text" ? "note" : next;
      interact({ kind: "pick", mode: picked });
      if (next === "file") window.setTimeout(() => fileInputRef.current?.click(), 0);
    },
    [interact],
  );

  // --- Submits ---------------------------------------------------------------
  const submitText = useCallback(() => {
    const value = text.trim();
    if (!value) return;
    onSubmit(detectFromText(value)); // Auto-Detect Notiz ↔ Link
    closeComposer();
  }, [text, onSubmit, closeComposer]);

  const submitFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      const { accepted, blocked, unknown } = partitionFiles(files);
      if (blocked.length > 0) {
        toast.error(
          blocked.length === 1
            ? `„${blocked[0].name}" wird nicht unterstützt`
            : `${blocked.length} Dateien nicht unterstützt`,
          { description: "Archive, Programme und Medien werden nicht verarbeitet." },
        );
      }
      if (unknown.length > 0) {
        toast.warning(
          unknown.length === 1
            ? `„${unknown[0].name}" — Format nicht garantiert`
            : `${unknown.length} Dateien mit unklarem Format`,
          { description: "Versuche es — könnte in der Verarbeitung scheitern." },
        );
      }
      if (accepted.length === 0) return;
      onSubmit(detectFromDrop(accepted));
      closeComposer();
    },
    [onSubmit, closeComposer],
  );

  const submitVoice = useCallback(() => {
    if (!voice.transcript) return;
    onSubmit(detectFromText(voice.transcript));
    closeComposer();
  }, [voice.transcript, onSubmit, closeComposer]);

  // --- Keyboard / Paste ------------------------------------------------------
  const handleTextKey = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        submitText();
      } else if (e.key === "Escape") {
        e.preventDefault();
        collapseIfEmpty();
      }
      // Enter ohne Modifier = Umbruch (Spec) — nicht abfangen.
    },
    [submitText, collapseIfEmpty],
  );

  /** Großer Paste (≥100 Z.) → Vorschau-Modus. */
  const handleTextareaPaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData?.getData("text/plain") ?? "";
    if (pasted.length >= 100) {
      e.preventDefault();
      setText(pasted);
      setPastePreview(true);
    }
  }, []);

  /** Datei-Paste direkt aufnehmen. */
  const handleRootPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const detected = detectFromPaste(e);
      if (detected?.type === "file") {
        e.preventDefault();
        onSubmit(detected);
        closeComposer();
      }
    },
    [onSubmit, closeComposer],
  );

  // Esc global schließt (nur wenn offen + leer).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") collapseIfEmpty();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, collapseIfEmpty]);

  return {
    open,
    mode,
    text,
    setText,
    pastePreview,
    setPastePreview,
    voice,
    textRef,
    fileInputRef,
    openComposer,
    closeComposer,
    collapseIfEmpty,
    setMode,
    submitText,
    submitFiles,
    submitVoice,
    handleTextKey,
    handleTextareaPaste,
    handleRootPaste,
  };
}
