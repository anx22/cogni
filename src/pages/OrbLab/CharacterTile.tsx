// =============================================================================
//  CharacterTile — statische, klickbare Auswahl-Karte pro Charakter.
//  Kein Pointer-Tracking, kein Hover-Smiley — nur ein ruhiges Vorschaubild.
// =============================================================================

import { useMemo } from "react";
import { CHARACTERS } from "@/components/entity/characters/registry";
import {
  ORB_PRESETS_DEFAULT,
  samplePreset,
} from "@/components/entity/orbPresets";
import type { CharacterId } from "@/components/entity/characters/types";
import { Check } from "lucide-react";

interface Props {
  id: CharacterId;
  active: boolean;
  onSelect: (id: CharacterId) => void;
}

export const CharacterTile = ({ id, active, onSelect }: Props) => {
  const character = CHARACTERS[id];
  const sample = useMemo(() => samplePreset(ORB_PRESETS_DEFAULT.idle), []);

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`group relative flex flex-col items-center gap-3 rounded-xl border bg-card/40 px-4 py-5 transition-all
        ${
          active
            ? "border-primary/60 ring-2 ring-primary/30 bg-card/70"
            : "border-border/40 hover:border-border hover:bg-card/60"
        }`}
      aria-pressed={active}
    >
      {active && (
        <span className="absolute top-2 right-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/90 text-primary-foreground">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </span>
      )}
      <div
        className="relative h-[88px] w-[88px] flex items-center justify-center pointer-events-none select-none"
        aria-hidden
      >
        {character.render({
          state: "idle",
          size: 80,
          sample,
        })}
      </div>
      <div className="text-xs tracking-wide text-foreground/90">
        {character.label}
      </div>
    </button>
  );
};
