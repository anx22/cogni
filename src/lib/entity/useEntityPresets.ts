// =============================================================================
//  Entity-Core — Kapselt Charakter-Wahl + Expressions-Ableitung.
// =============================================================================

import { useMemo } from "react";
import { useSelectedCharacter } from "@/components/entity/useSelectedCharacter";
import { deriveExpression } from "./deriveExpression";
import type { EntityState, ExpressionVM, InteractionMode, CharacterId } from "./types";

export function useEntityPresets(
  state: EntityState,
  mode: InteractionMode = "resting",
): { vm: ExpressionVM; characterId: CharacterId } {
  const { characterId } = useSelectedCharacter();
  const vm = useMemo(() => deriveExpression(state, mode), [state, mode]);
  return { vm, characterId: characterId as CharacterId };
}
