// =============================================================================
//  useMeasuredOrbPx — misst die tatsächlich gerenderte Pixelbreite einer Box
//  via ResizeObserver. Prinzip „CSS rendert, JS misst": Die Größenquelle bleibt
//  CSS (px/clamp/vmin), die Zahl entsteht durch Messung → der Orb folgt echt der
//  Viewport-relativen Größe statt eines fixen parseInt-Fallbacks.
//
//  Guards: ignoriert 0 (z.B. EntityRail `hidden lg:flex` unter 1024px → hält den
//  letzten gültigen Wert) und re-rendert nur bei tatsächlicher Größenänderung.
// =============================================================================

import { useLayoutEffect, useRef, useState } from "react";

/**
 * @param enabled Nur messen, wenn die Größe nicht aus dem CSS-String ablesbar ist
 *  (clamp/vmin). Für einfache px-Größen (Rail/Sidebar/Lab-Vorschau) übergibt der
 *  Aufrufer `enabled=false` und nutzt direkt den geparsten Wert — robust auch in
 *  Umgebungen ohne funktionierenden ResizeObserver.
 */
export function useMeasuredOrbPx(
  ref: React.RefObject<HTMLElement>,
  fallback: number,
  enabled = true,
): number {
  const [px, setPx] = useState(fallback);
  const last = useRef(fallback);

  useLayoutEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
      const rounded = Math.round(w);
      if (rounded > 0 && rounded !== last.current) {
        last.current = rounded;
        setPx(rounded);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, enabled]);

  return px;
}
