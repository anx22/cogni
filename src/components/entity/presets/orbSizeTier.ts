// =============================================================================
//  orbSizeTier — drei Größen-Stufen der Entität, viewport-relativ.
//  Die persistierte Einstellung (useOrbSizeTier) steuert die HOME-Darstellung
//  relativ zum Viewport (vmin); im OrbLab wirkt sie nur adaptiv auf die fixe
//  Vorschau-Box. `vmin` hält den Orb rund + proportional zur kleineren Achse,
//  clamp() schützt Phone (Untergrenze) und 4K (Obergrenze).
// =============================================================================

export type OrbSizeTier = "small" | "medium" | "large";

export const ORB_SIZE_TIER_DEFAULT: OrbSizeTier = "medium";

export const ORB_SIZE_TIERS: OrbSizeTier[] = ["small", "medium", "large"];

export const ORB_SIZE_TIER_LABEL: Record<OrbSizeTier, string> = {
  small: "Klein",
  medium: "Mittel",
  large: "Groß",
};

/** Viewport-relative Größe für die Home-Entität. */
export const ORB_TIER_HOME_SIZE: Record<OrbSizeTier, string> = {
  small: "clamp(120px, 22vmin, 200px)",
  medium: "clamp(200px, 38vmin, 340px)",
  large: "clamp(300px, 56vmin, 520px)",
};

/** Fixe Vorschau-Größe im OrbLab (Preview-Box ist fix, daher px). */
export const ORB_TIER_PREVIEW_SIZE: Record<OrbSizeTier, string> = {
  small: "140px",
  medium: "240px",
  large: "340px",
};
