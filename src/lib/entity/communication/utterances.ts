// =============================================================================
//  Entity-Core — deriveUtterance (rein, der Kern der dritten Säule).
//  Trigger → Utterance|Clear|Skip. agent_reason-Override > Vokabular.
// =============================================================================

import type { CommunicationInput, DeriveResult, UtterancePolicy, VoiceProfile } from "./types";
import { isClear } from "./types";
import { INTENT_PRIORITY, INTENT_TONE, VOCABULARY, fillSlots, pickVariant } from "./vocabulary";
import { passesChattiness } from "./policy";

export interface DeriveContext {
  /** Zuletzt gezeigter Varianten-Index je Intent (Anti-Repeat). */
  prevIndex?: number;
  /** Reproduzierbare Varianten-Wahl (Tests + Anti-Stagnation). */
  seed?: number;
  profile?: VoiceProfile;
}

/**
 * Reine Ableitung. Reihenfolge:
 *  1. clear → Stimme abräumen.
 *  2. agent_reason (nur review.ready) → wörtlich, höchste Priorität, immer sprechen.
 *  3. Chattiness-Gate → ggf. skip.
 *  4. Vokabular: Variante (Anti-Repeat) + Slots + fester Ton.
 */
export function deriveUtterance(
  input: CommunicationInput,
  policy: UtterancePolicy,
  ctx: DeriveContext = {},
): DeriveResult {
  if (isClear(input)) return { action: "clear" };

  const { intent, slots, agentReason, retryAssetId } = input;
  const priority = INTENT_PRIORITY[intent];

  // agent_reason override: nur sinnvoll bei review.ready, schlägt alles, ignoriert Gating.
  if (intent === "review.ready" && agentReason && agentReason.trim()) {
    return {
      action: "show",
      intent,
      variantIndex: -1,
      utterance: { text: agentReason.trim(), tone: "ready", retryAssetId: retryAssetId ?? null },
    };
  }

  if (!passesChattiness(priority, policy.chattiness)) return { action: "skip" };

  const variants = VOCABULARY[intent];
  const { index, text } = pickVariant(variants, ctx.prevIndex ?? -1, ctx.seed ?? 0);
  const filled = fillSlots(text, withDerivedSlots(slots));

  return {
    action: "show",
    intent,
    variantIndex: index,
    utterance: { text: filled, tone: INTENT_TONE[intent], retryAssetId: retryAssetId ?? null },
  };
}

/** Leitet Hilfs-Slots ab (z.B. Pluralisierung von „Sache/Sachen"). */
function withDerivedSlots(
  slots?: Record<string, string | number>,
): Record<string, string | number> | undefined {
  if (!slots) return slots;
  const out = { ...slots };
  if ("n" in out && !("sache" in out)) {
    out.sache = Number(out.n) === 1 ? "Sache" : "Sachen";
  }
  return out;
}
