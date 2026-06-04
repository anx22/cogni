// =============================================================================
//  SignatureLayer — legt die aktuelle Bewegungs-Signatur als eigene Transform-
//  Ebene über den gerenderten Charakter. Eigenes Box-Element, getrennt vom
//  Pointer-Follow (der translate3d auf den ÄUSSEREN Wrapper setzt) → keine
//  Transform-Kollision.
//
//  Warum imperativ über die Web Animations API statt CSS-Klassen?
//  Ein CSS-Klassen-Swap startet die Keyframe-Animation bei jedem Signatur-
//  Wechsel hart bei Frame 0 → sichtbarer Snap, wenn die alte Animation gerade
//  z. B. bei scale(1.09) stand. Die WAA erlaubt einen weichen „Bridge"-Übergang
//  (aktuelle Live-Pose → Ruhe) und übergibt dann nahtlos an die Loop-Animation.
//  commitStyles() friert beim Wechsel die Live-Pose ins Inline-Style ein, sodass
//  der nächste Effekt-Lauf exakt von dort weiter überblendet — auch bei schnellen
//  Mehrfach-Wechseln (race-safe per disposed-Flag, kein transitionend-Deadlock).
// =============================================================================

import { useEffect, useRef, type ReactNode } from "react";
import type { MotionSignature } from "@/lib/entity";
import { usePrefersReducedMotion } from "./useMotionSignature";
import { BRIDGE_MS, ENTITY_EASE_SNAP, resolveSignatureMotion } from "./signatures";

interface SignatureLayerProps {
  signature: MotionSignature;
  children: ReactNode;
}

const IDENTITY_MATRIX = "matrix(1, 0, 0, 1, 0, 0)";

export function SignatureLayer({ signature, children }: SignatureLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const resolved = resolveSignatureMotion(signature, reduced);

    let disposed = false;
    let loop: Animation | null = null;
    let bridge: Animation | null = null;

    // Aktuelle, sichtbare Pose lesen. Ein vorheriger Effekt-Cleanup hat sie via
    // commitStyles() ins Inline-Style geschrieben → getComputedStyle liefert sie.
    const cs = getComputedStyle(el);
    const fromTransform = cs.transform;
    const fromFilter = cs.filter;
    const fromOpacity = cs.opacity;
    const atRest =
      (fromTransform === "none" || fromTransform === IDENTITY_MATRIX) &&
      (fromFilter === "none" || fromFilter === "") &&
      (fromOpacity === "" || fromOpacity === "1");

    const clearInline = () => {
      el.style.transform = "";
      el.style.filter = "";
      el.style.opacity = "";
    };

    const fromKeyframe: Keyframe = {
      transform: fromTransform === "none" ? "none" : fromTransform,
      filter: fromFilter === "none" ? "none" : fromFilter,
      opacity: fromOpacity === "" ? 1 : Number(fromOpacity),
    };

    /** Weicher Rückweg von der Live-Pose zu einer Ziel-Pose, dann onDone. */
    const bridgeTo = (to: Keyframe, onDone: () => void) => {
      bridge = el.animate([fromKeyframe, to], {
        duration: BRIDGE_MS,
        easing: ENTITY_EASE_SNAP,
        fill: "forwards",
      });
      bridge.finished
        .then(() => {
          if (disposed) return;
          onDone();
          bridge?.cancel();
        })
        .catch(() => {
          /* Bridge wurde abgebrochen (neuere Signatur übernahm) — ok. */
        });
    };

    const restKeyframe: Keyframe = { transform: "none", filter: "none", opacity: 1 };

    if (resolved.mode === "animate") {
      const startLoop = () => {
        if (disposed) return;
        clearInline();
        loop = el.animate(resolved.keyframes!, resolved.timing!);
      };
      if (atRest) startLoop();
      else bridgeTo(restKeyframe, startLoop);
    } else if (resolved.mode === "static") {
      const pose = resolved.staticStyle!;
      const toKeyframe: Keyframe = {
        transform: pose.transform ?? "none",
        filter: pose.filter ?? "none",
        opacity: 1,
      };
      const hold = () => {
        // Pose über Inline-Style halten (fill der Bridge wird gleich gecancelt).
        el.style.transform = pose.transform ?? "";
        el.style.filter = pose.filter ?? "";
        el.style.opacity = "";
      };
      // Auch „at rest" überblenden wir kurz, damit der statische Zustand nicht
      // hart einrastet (z. B. idle → busy-blocked).
      bridgeTo(toKeyframe, hold);
    } else {
      // mode === "none": weich zur Ruhe, dann Inline säubern.
      if (atRest) clearInline();
      else bridgeTo(restKeyframe, clearInline);
    }

    return () => {
      disposed = true;
      // Live-Pose der gerade laufenden Animation einfrieren, damit der nächste
      // Effekt-Lauf nahtlos von hier weiter überblendet (kein Sprung zurück).
      const live = loop ?? bridge;
      try {
        live?.commitStyles();
      } catch {
        /* Element (noch) nicht gerendert — ignorieren. */
      }
      loop?.cancel();
      bridge?.cancel();
    };
  }, [signature, reduced]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
