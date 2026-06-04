// =============================================================================
//  Character types — kleine Abstraktion für austauschbare Entity-Visuals.
// =============================================================================

import type { ReactNode } from "react";
import type { EntityState, SampledPreset } from "../presets/orbPresets";
import type { InputMode } from "../InputPills";
import type { CharacterManifest } from "@/lib/entity";

export type CharacterId = "siri" | "face-pill";

/**
 * Interaktions-Tiefe eines Charakter-Mounts:
 * - "full"   — normaler App-Mount (Home): volle Maus-/Hot-Area, Open-Verhalten.
 * - "self"   — Config-Vorschau (OrbLab): Reaktionsbereich auf die Komponente
 *              begrenzt (FacePill-Tilt nur über der Pill, nicht size*2).
 * - "static" — reines Standbild (Tiles): keine Sensoren/Buttons, kein Open.
 */
export type CharacterInteraction = "full" | "self" | "static";

export interface CharacterRenderProps {
  state: EntityState;
  size: number;
  sample: SampledPreset;
  /** Nur relevant für Charaktere mit Input-Mode-Picker (face-pill). */
  onPickInputMode?: (mode: InputMode) => void;
  /** Interaktions-Tiefe. Default in Konsumenten: "full". */
  interaction?: CharacterInteraction;
}

export interface Character {
  id: CharacterId;
  label: string;
  manifest: CharacterManifest;
  render: (props: CharacterRenderProps) => ReactNode;
}
