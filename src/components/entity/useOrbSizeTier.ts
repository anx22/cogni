// =============================================================================
//  useOrbSizeTier — App-weite Persistenz der Entity-Größenstufe via app_settings
//  (namespace="orb", key="size.tier", scope="user"). Per-User-Preference,
//  RLS-sauber, Realtime-synced. Vorbild: useSelectedCharacter.
// =============================================================================

import { useCallback } from "react";
import { useNamespace } from "@/lib/settings/useNamespace";
import { ORB_SIZE_TIER_DEFAULT, type OrbSizeTier } from "./presets/orbSizeTier";

export function useOrbSizeTier() {
  const { values, setValue, loaded } = useNamespace<OrbSizeTier>("orb", {
    scope: "user",
  });
  const tier = (values["size.tier"] as OrbSizeTier) ?? ORB_SIZE_TIER_DEFAULT;
  const setTier = useCallback((t: OrbSizeTier) => setValue("size.tier", t), [setValue]);
  return { tier, setTier, loaded };
}
