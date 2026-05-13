// =============================================================================
//  useSelectedCharacter — App-weite Persistenz des Entity-Charakters via
//  app_settings (namespace="orb", key="character"). Realtime-synced.
// =============================================================================

import { useCallback } from "react";
import { useNamespace } from "@/lib/settings/useNamespace";
import { DEFAULT_CHARACTER_ID } from "./characters/registry";
import type { CharacterId } from "./characters/types";

export function useSelectedCharacter() {
  const { values, setValue, loaded } = useNamespace<CharacterId>("orb");
  const characterId = (values.character as CharacterId) ?? DEFAULT_CHARACTER_ID;
  const setCharacterId = useCallback(
    (c: CharacterId) => setValue("character", c),
    [setValue],
  );
  return { characterId, setCharacterId, loaded };
}
