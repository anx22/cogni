// =============================================================================
//  Entity-Core — Realtime-Row → UtteranceTrigger (rein, testbar).
//  Faithful migriert aus dem alten useEntityVoice; speist denselben
//  Signal-Stream wie die State-Machine (eine Subscription in useEntitySources).
// =============================================================================

import type { CommunicationInput, UtteranceTrigger } from "./types";

export interface AssetRowLike {
  id?: string;
  file_type?: string;
  processing_status?: string;
  understanding_status?: string;
}

export interface DialogRowLike {
  id?: string;
  status?: string;
  total_boxes?: number;
  metadata?: Record<string, unknown> | null;
}

/** assets INSERT → „Ich nehme … auf." */
export function assetInsertTriggers(row: AssetRowLike): UtteranceTrigger[] {
  const intent =
    row.file_type === "note"
      ? "intake.note"
      : row.file_type === "other"
        ? "intake.other"
        : "intake.doc";
  return [{ intent }];
}

/** assets UPDATE → Processing- und/oder Understanding-Spur (kann beides liefern). */
export function assetUpdateTriggers(row: AssetRowLike): UtteranceTrigger[] {
  const out: UtteranceTrigger[] = [];
  if (row.processing_status === "processing") {
    out.push({ intent: row.file_type === "note" ? "processing.note" : "processing.doc" });
  }
  switch (row.understanding_status) {
    case "running":
      out.push({ intent: "understanding.running" });
      break;
    case "empty":
      out.push({ intent: "understanding.empty" });
      break;
    case "failed":
      out.push({ intent: "understanding.failed", retryAssetId: row.id });
      break;
    case "rate_limited":
      out.push({ intent: "understanding.rate_limited", retryAssetId: row.id });
      break;
    case "payment_required":
      out.push({ intent: "understanding.payment_required", retryAssetId: row.id });
      break;
  }
  return out;
}

/** proposed_facts INSERT → „Ich erkenne etwas." */
export function proposedInsertTriggers(): UtteranceTrigger[] {
  return [{ intent: "proposed.first" }];
}

/** dialog_sessions INSERT → review.ready (agent_reason-Override wenn vorhanden). */
export function dialogInsertTriggers(row: DialogRowLike): UtteranceTrigger[] {
  const n = row.total_boxes ?? 0;
  const assignment = (row.metadata?.assignment ?? null) as { agent_reason?: string } | null;
  const agentReason = assignment?.agent_reason ?? null;
  return [{ intent: "review.ready", slots: { n }, agentReason }];
}

/** dialog_sessions UPDATE → bei Abschluss Stimme abräumen. */
export function dialogUpdateInputs(row: DialogRowLike): CommunicationInput[] {
  if (row.status === "completed" || row.status === "cancelled") return [{ clear: true }];
  return [];
}
