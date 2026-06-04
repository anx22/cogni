// =============================================================================
//  useMotionSignature — Single-Source-Hook für die aufgelöste Bewegungs-Spec
//  einer Signatur (inkl. prefers-reduced-motion). Reaktiv: ändert sich die
//  System-Einstellung zur Laufzeit, re-rendert der Consumer.
//
//  Erweiterungspunkt (später): amplitudeSource — eine Live-Quelle (z. B.
//  Audio-Pegel beim Sprechen), die die Bewegungs-Amplitude moduliert. Bewusst
//  noch nicht verdrahtet, damit die Geometrie 1:1 referenztreu bleibt.
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import type { MotionSignature } from "@/lib/entity";
import { resolveSignatureMotion, type ResolvedMotion } from "./signatures";

const QUERY = "(prefers-reduced-motion: reduce)";

/** Reaktiver prefers-reduced-motion-Status. SSR-/Test-sicher. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener?.(onChange); // ältere Safari
    setReduced(mql.matches);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener?.(onChange);
    };
  }, []);

  return reduced;
}

/**
 * Aufgelöste Bewegungs-Spec für eine Signatur. `prefersReduced` kann explizit
 * übergeben werden (Tests/OrbLab); sonst wird die System-Einstellung genutzt.
 */
export function useMotionSignature(
  signature: MotionSignature,
  prefersReduced?: boolean,
): ResolvedMotion {
  const auto = usePrefersReducedMotion();
  const reduced = prefersReduced ?? auto;
  return useMemo(() => resolveSignatureMotion(signature, reduced), [signature, reduced]);
}
