// =============================================================================
//  StaticStatePreview — Standbild-Tile für einen einzelnen State.
//  Kein Drag, kein Click-Reaktion auf den Orb selbst (Tile ist klickbar).
// =============================================================================

import { useMemo } from "react";
import { CHARACTERS } from "@/components/entity/characters/registry";
import {
  samplePreset,
  type EntityState,
  type OrbPresetRange,
} from "@/components/entity/orbPresets";
import type { CharacterId } from "@/components/entity/characters/types";

interface Props {
  state: EntityState;
  characterId: CharacterId;
  preset: OrbPresetRange;
  active: boolean;
  onSelect: (s: EntityState) => void;
  seed?: number;
}

export const StaticStatePreview = ({
  state,
  characterId,
  preset,
  active,
  onSelect,
  seed = 0,
}: Props) => {
  const character = CHARACTERS[characterId];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sample = useMemo(() => samplePreset(preset), [preset, seed]);

  return (
    <button
      type="button"
      onClick={() => onSelect(state)}
      className={`group flex flex-col items-center gap-2 rounded-lg border bg-card/30 p-3 transition-colors
        ${
          active
            ? "border-primary/50 bg-card/70"
            : "border-border/40 hover:border-border"
        }`}
    >
      <div
        className="relative h-[72px] w-[72px] flex items-center justify-center pointer-events-none select-none"
        aria-hidden
      >
        {character.render({ state, size: 64, sample })}
      </div>
      <div className="text-[10px] tracking-wide text-foreground/80">
        {state}
      </div>
    </button>
  );
};
