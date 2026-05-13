// =============================================================================
//  Character-Registry. Neue Charaktere hier eintragen, fertig.
// =============================================================================

import type { Character, CharacterId } from "./types";
import { SiriCharacter } from "./SiriCharacter";
import { FacePillCharacter } from "./FacePillCharacter";

export const CHARACTERS: Record<CharacterId, Character> = {
  siri: SiriCharacter,
  "face-pill": FacePillCharacter,
};

export const CHARACTER_LIST: Character[] = [SiriCharacter, FacePillCharacter];

export const DEFAULT_CHARACTER_ID: CharacterId = "siri";
