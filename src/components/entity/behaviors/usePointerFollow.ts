// =============================================================================
//  usePointerFollow — rAF-Damping-Follow für den Entity-Wrapper.
//  Keine React-Re-Renders, kein preventDefault. Respektiert reduced-motion.
//  enabled=false (FacePill: suppressCore pointer-follow) → no-op.
// =============================================================================

import { useEffect, useRef } from "react";

const FOLLOW_MAX_OFFSET = 14;
const FOLLOW_DAMPING = 0.18;

export function usePointerFollow(ref: React.RefObject<HTMLElement>, enabled: boolean): void {
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);
  const active = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const tick = () => {
      const dx = target.current.x - current.current.x;
      const dy = target.current.y - current.current.y;
      current.current.x += dx * FOLLOW_DAMPING;
      current.current.y += dy * FOLLOW_DAMPING;
      el.style.transform = `translate3d(${current.current.x.toFixed(2)}px, ${current.current.y.toFixed(2)}px, 0)`;

      const settled = Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05;
      if (settled && !active.current) {
        current.current.x = 0;
        current.current.y = 0;
        el.style.transform = "translate3d(0,0,0)";
        raf.current = null;
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };

    const ensureLoop = () => {
      if (raf.current == null) raf.current = requestAnimationFrame(tick);
    };

    const updateTarget = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      // Subtract current translation to get the natural (rest) center.
      // getBoundingClientRect reflects the painted position including any
      // in-flight translate3d — without this correction the target shrinks as
      // the element chases the pointer, creating a feedback oscillation.
      const naturalCx = rect.left + rect.width / 2 - current.current.x;
      const naturalCy = rect.top + rect.height / 2 - current.current.y;
      const nx = (clientX - naturalCx) / (rect.width / 2);
      const ny = (clientY - naturalCy) / (rect.height / 2);
      const clamp = (v: number) => Math.max(-1, Math.min(1, v));
      target.current.x = clamp(nx) * FOLLOW_MAX_OFFSET;
      target.current.y = clamp(ny) * FOLLOW_MAX_OFFSET;
      ensureLoop();
    };

    const reset = () => {
      active.current = false;
      target.current.x = 0;
      target.current.y = 0;
      ensureLoop();
    };

    const onPointerDown = (e: PointerEvent) => {
      active.current = true;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      updateTarget(e.clientX, e.clientY);
    };
    const onPointerMove = (e: PointerEvent) => {
      // Maus: nur bei Hover über Element folgen
      // Touch/Pen: nach pointerdown via capture
      if (e.pointerType === "mouse" && !active.current) {
        updateTarget(e.clientX, e.clientY);
        return;
      }
      if (active.current) updateTarget(e.clientX, e.clientY);
    };
    const onPointerEnd = () => reset();
    const onPointerLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && !active.current) reset();
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerEnd);
    el.addEventListener("pointercancel", onPointerEnd);
    el.addEventListener("pointerleave", onPointerLeave);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerEnd);
      el.removeEventListener("pointercancel", onPointerEnd);
      el.removeEventListener("pointerleave", onPointerLeave);
      if (raf.current != null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
  }, [ref, enabled]);
}
