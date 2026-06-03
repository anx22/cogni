// =============================================================================
//  Character types — kleine Abstraktion für austauschbare Entity-Visuals.
// =============================================================================

import type { ReactNode } from "react";
import type { EntityState, SampledPreset } from "../presets/orbPresets";
import type { InputMode } from "../InputPills";
import type { CharacterManifest } from "@/lib/entity";

export type CharacterId = "siri" | "face-pill";

export interface CharacterRenderProps {
  state: EntityState;
  size: number;
  sample: SampledPreset;
  /** Nur relevant für Charaktere mit Input-Mode-Picker (face-pill). */
  onPickInputMode?: (mode: InputMode) => void;
}

export interface Character {
  id: CharacterId;
  label: string;
  manifest: CharacterManifest;
  render: (props: CharacterRenderProps) => ReactNode;
}
