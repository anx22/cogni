// =============================================================================
//  SiriCharacter — bisheriges Default-Visual: SiriOrb mit Punktraster-Surface.
// =============================================================================

import SiriOrb from "../SiriOrb";
import EntitySurface from "../EntitySurface";
import type { Character } from "./types";

export const SiriCharacter: Character = {
  id: "siri",
  label: "Siri",
  render: ({ size, sample }) => (
    <>
      <EntitySurface orbSize={size} surface={sample.surface} />
      <SiriOrb
        size={`${size}px`}
        colors={sample.colors}
        animationDuration={sample.duration}
        className="pointer-events-none"
      />
    </>
  ),
};
