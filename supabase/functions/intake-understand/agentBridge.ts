// =============================================================================
//  intake-understand / agentBridge — Agent-Aufrufe + Status-Schreiber.
// =============================================================================
// deno-lint-ignore-file no-explicit-any

import {
  AgentRateLimitError,
  AgentPaymentError,
  AgentTimeoutError,
} from "../_shared/agentClient.ts";

export type AgentErrorOutcome = {
  status: number;
  error: string;
  assetStatus: string;
  assetError: string;
};

export async function setStatus(
  admin: any,
  asset_id: string,
  status: string,
  error: string | null,
) {
  await admin
    .from("assets")
    .update({ understanding_status: status, understanding_error: error })
    .eq("id", asset_id);
}

/** Mappt einen Agent-Fehler auf Status-Code + Asset-Status. Schreibt Asset-Status mit. */
export async function handleAgentError(
  admin: any,
  asset_id: string,
  err: unknown,
): Promise<AgentErrorOutcome> {
  if (err instanceof AgentRateLimitError) {
    await setStatus(admin, asset_id, "rate_limited", "Agent ist gerade überlastet.");
    return {
      status: 429,
      error: "rate_limited",
      assetStatus: "rate_limited",
      assetError: "Agent ist gerade überlastet.",
    };
  }
  if (err instanceof AgentPaymentError) {
    await setStatus(admin, asset_id, "payment_required", "Agent benötigt Credits.");
    return {
      status: 402,
      error: "payment_required",
      assetStatus: "payment_required",
      assetError: "Agent benötigt Credits.",
    };
  }
  if (err instanceof AgentTimeoutError) {
    await setStatus(admin, asset_id, "failed", "Agent hat zu lange gebraucht.");
    return {
      status: 504,
      error: "agent_timeout",
      assetStatus: "failed",
      assetError: "Agent hat zu lange gebraucht.",
    };
  }
  const msg = err instanceof Error ? err.message : String(err);
  await setStatus(admin, asset_id, "failed", msg.slice(0, 240));
  return { status: 500, error: msg, assetStatus: "failed", assetError: msg.slice(0, 240) };
}
