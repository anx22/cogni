// =============================================================================
//  useDropZone — kapselt File-Drag-Logik (Counter, Safety-Resets, MIME-Filter).
//  Scope "window": global; ref-Scope: pro Element. Liefert isDragging-Flag.
//  Konsumenten registrieren ihre Drag-Handler nicht selbst — alles via Hook.
// =============================================================================
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

interface Options {
  scope?: "window" | "element";
  ref?: RefObject<HTMLElement>;
  enabled?: boolean;
  busy?: boolean;
  onDrop: (files: File[]) => void;
}

interface Result {
  isDragging: boolean;
}

export const useDropZone = ({
  scope = "window",
  ref,
  enabled = true,
  busy = false,
  onDrop,
}: Options): Result => {
  const [isDragging, setIsDragging] = useState(false);
  const counter = useRef(0);

  const reset = useCallback(() => {
    counter.current = 0;
    setIsDragging(false);
  }, []);

  // Forciere Reset, wenn Owner busy wird (verhindert Layer-Hänger).
  useEffect(() => {
    if (busy) reset();
  }, [busy, reset]);

  useEffect(() => {
    if (!enabled) {
      reset();
      return;
    }

    const target: EventTarget | null = scope === "window" ? window : (ref?.current ?? null);
    if (!target) return;

    const isFiles = (e: DragEvent) => !!e.dataTransfer?.types.includes("Files");

    const onEnter = (ev: Event) => {
      const e = ev as DragEvent;
      e.preventDefault();
      if (busy || !isFiles(e)) {
        reset();
        return;
      }
      counter.current += 1;
      setIsDragging(true);
    };

    const onOver = (ev: Event) => {
      const e = ev as DragEvent;
      e.preventDefault();
      if (!e.dataTransfer) return;
      if (busy || !isFiles(e)) {
        e.dataTransfer.dropEffect = "none";
        reset();
        return;
      }
      e.dataTransfer.dropEffect = "copy";
      if (!isDragging) setIsDragging(true);
    };

    const onLeave = (ev: Event) => {
      const e = ev as DragEvent;
      e.preventDefault();
      if (busy) {
        reset();
        return;
      }
      counter.current = Math.max(0, counter.current - 1);
      if (counter.current === 0) setIsDragging(false);
    };

    const onDropEv = (ev: Event) => {
      const e = ev as DragEvent;
      e.preventDefault();
      reset();
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length > 0) onDrop(files);
    };

    target.addEventListener("dragenter", onEnter);
    target.addEventListener("dragover", onOver);
    target.addEventListener("dragleave", onLeave);
    target.addEventListener("drop", onDropEv);

    // Safety-Resets nur im window-Scope.
    const onWindowReset = () => reset();
    const onVisibility = () => {
      if (document.visibilityState !== "visible") reset();
    };
    if (scope === "window") {
      window.addEventListener("dragend", onWindowReset);
      window.addEventListener("blur", onWindowReset);
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      target.removeEventListener("dragenter", onEnter);
      target.removeEventListener("dragover", onOver);
      target.removeEventListener("dragleave", onLeave);
      target.removeEventListener("drop", onDropEv);
      if (scope === "window") {
        window.removeEventListener("dragend", onWindowReset);
        window.removeEventListener("blur", onWindowReset);
        document.removeEventListener("visibilitychange", onVisibility);
      }
    };
  }, [enabled, scope, ref, busy, onDrop, reset, isDragging]);

  return { isDragging };
};
