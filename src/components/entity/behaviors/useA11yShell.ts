// =============================================================================
//  useA11yShell — zentralisierte A11y-Props für EntityRoot.
//  Gibt role/aria-label/aria-busy/tabIndex/onKeyDown zurück; state-adaptiv.
//  Setzt aria-busy nur bei processing (nicht als false-Attribut im DOM).
// =============================================================================

import { useCallback } from "react";
import type React from "react";
import type { EntityState } from "@/lib/entity";

const ARIA_LABELS: Record<EntityState, string> = {
  idle: "Entität — Eingabe starten",
  hover: "Entität — Eingabe starten",
  processing: "Entität — Verarbeitung läuft",
  "review-ready": "Entität — Review öffnen",
  failed: "Entität — Fehler aufgetreten, bestätigen",
  "busy-blocked": "Entität — beschäftigt",
};

export interface A11yShellProps {
  role: "button";
  "aria-label": string;
  "aria-busy"?: true;
  tabIndex: number;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function useA11yShell(state: EntityState, onActivate: () => void): A11yShellProps {
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onActivate();
      }
    },
    [onActivate],
  );

  return {
    role: "button",
    "aria-label": ARIA_LABELS[state],
    ...(state === "processing" ? { "aria-busy": true as const } : {}),
    tabIndex: 0,
    onKeyDown,
  };
}
