// =============================================================================
//  useOrbLibrary — benannte Orb-Presets (Vorlagen-Bibliothek).
//  Persistiert als EIN Array unter app_settings (namespace="orb",
//  key="library.presets", scope="user"). Reiner Vorlagen-Speicher: „Anwenden"
//  schreibt in den aktiven State-Slot (über useOrbPresets.setPreset), mutiert
//  die Library NICHT. Funktionale Updates über valuesRef → debounce-sicher.
// =============================================================================

import { useCallback, useRef } from "react";
import { useNamespace } from "@/lib/settings/useNamespace";
import type { OrbPresetRange } from "./orbPresets";

export interface NamedPreset {
  id: string;
  name: string;
  createdAt: number;
  preset: OrbPresetRange;
}

const KEY = "library.presets";

const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `p_${Date.now()}_${Math.round(Math.random() * 1e6)}`;

export function useOrbLibrary() {
  const { values, setValue, loaded } = useNamespace<NamedPreset[]>("orb", {
    scope: "user",
  });
  const presets = (values[KEY] as NamedPreset[] | undefined) ?? [];

  // Aktuellen Stand in einer Ref halten, damit schnelle Folge-Mutationen
  // (save → rename) nicht aus einer stale Closure ableiten.
  const ref = useRef(presets);
  ref.current = presets;

  const save = useCallback(
    (name: string, preset: OrbPresetRange) => {
      const entry: NamedPreset = { id: newId(), name, createdAt: Date.now(), preset };
      setValue(KEY, [...ref.current, entry]);
    },
    [setValue],
  );

  const remove = useCallback(
    (id: string) =>
      setValue(
        KEY,
        ref.current.filter((p) => p.id !== id),
      ),
    [setValue],
  );

  const rename = useCallback(
    (id: string, name: string) =>
      setValue(
        KEY,
        ref.current.map((p) => (p.id === id ? { ...p, name } : p)),
      ),
    [setValue],
  );

  return { presets, loaded, save, remove, rename };
}
