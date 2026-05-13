// =============================================================================
//  Character types — kleine Abstraktion für austauschbare Entity-Visuals.
// =============================================================================

import type { ReactNode } from "react";
import type { EntityState, SampledPreset } from "../orbPresets";
import type { InputMode } from "../InputPills";

export type CharacterId = "siri" | "face-pill";

export interface CharacterRenderProps {
  state: EntityState;
  size: number;
  sample: SampledPreset;
  onClick?: () => void;
  /** Nur relevant für Charaktere mit Input-Mode-Picker (face-pill). */
  onPickInputMode?: (mode: InputMode) => void;
}

export interface Character {
  id: CharacterId;
  label: string;
  render: (props: CharacterRenderProps) => ReactNode;
}
