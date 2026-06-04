// =============================================================================
//  Entity-Core — Kommunikations-Hook (im Provider, EINMAL gemountet).
//  Konsumiert CommunicationInputs aus dem EINEN Signal-Stream (useEntitySources)
//  — keine eigene Realtime-Subscription mehr (löst die alte useEntityVoice-Insel).
//  Queue + Mindest-Anzeigedauer + Auto-Clear; Anti-Repeat je Intent.
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNamespace } from "@/lib/settings/useNamespace";
import { useSelectedCharacter } from "@/components/entity/useSelectedCharacter";
import { CHARACTERS } from "@/components/entity/characters/registry";
import { deriveUtterance } from "./utterances";
import { MIN_DISPLAY_MS, READY_CLEAR_MS } from "./policy";
import type { Chattiness, CommunicationInput, Intent, Utterance, VoiceProfile } from "./types";

export interface CommunicationState {
  utterance: Utterance | null;
  pushInput: (input: CommunicationInput) => void;
}

const EMPTY: Utterance | null = null;

export function useEntityCommunication(): CommunicationState {
  const [utterance, setUtterance] = useState<Utterance | null>(EMPTY);

  const { values } = useNamespace<Chattiness>("orb", { scope: "user" });
  const chattiness: Chattiness = (values.chattiness as Chattiness) ?? "balanced";

  const { characterId } = useSelectedCharacter();
  const profile: VoiceProfile | undefined =
    CHARACTERS[characterId as keyof typeof CHARACTERS]?.manifest?.voiceProfile;

  const lastShownAt = useRef(0);
  const queue = useRef<Utterance[]>([]);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drainTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevIndex = useRef<Partial<Record<Intent, number>>>({});
  const seedCounter = useRef(0);

  // Aktuelle Policy-/Profil-Werte ohne Re-Bind der pushInput-Identität.
  const policyRef = useRef({ chattiness });
  policyRef.current = { chattiness };
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const drain = useCallback(() => {
    if (queue.current.length === 0) return;
    const wait = Math.max(0, MIN_DISPLAY_MS - (Date.now() - lastShownAt.current));
    if (drainTimer.current) clearTimeout(drainTimer.current);
    drainTimer.current = setTimeout(() => {
      const next = queue.current.shift();
      if (!next) return;
      lastShownAt.current = Date.now();
      setUtterance(next);
      if (clearTimer.current) clearTimeout(clearTimer.current);
      if (next.tone === "ready" && next.text) {
        clearTimer.current = setTimeout(() => setUtterance(EMPTY), READY_CLEAR_MS);
      }
      if (queue.current.length > 0) drain();
    }, wait);
  }, []);

  const pushInput = useCallback(
    (input: CommunicationInput) => {
      const result = deriveUtterance(input, policyRef.current, {
        prevIndex: "intent" in input ? (prevIndex.current[input.intent] ?? -1) : -1,
        seed: seedCounter.current++,
        profile: profileRef.current,
      });
      if (result.action === "clear") {
        if (clearTimer.current) clearTimeout(clearTimer.current);
        if (drainTimer.current) clearTimeout(drainTimer.current);
        queue.current = [];
        setUtterance(EMPTY);
        return;
      }
      if (result.action === "skip") return;
      prevIndex.current[result.intent] = result.variantIndex;
      queue.current.push(result.utterance);
      drain();
    },
    [drain],
  );

  useEffect(() => {
    return () => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
      if (drainTimer.current) clearTimeout(drainTimer.current);
    };
  }, []);

  return useMemo(() => ({ utterance, pushInput }), [utterance, pushInput]);
}
