// =============================================================================
//  Entity-Core — Realtime-Row → EntitySignal (rein, ohne Supabase).
//  Neue Heimat der Übersetzungslogik aus Index.tsx; useEntitySources ruft dies.
// =============================================================================

import type { EntitySignal, IntakeFailReason } from "./types";

export type RealtimeEvent = "INSERT" | "UPDATE";

export interface AssetRowLike {
  id?: string;
  file_type?: string;
  understanding_status?: string;
  processing_status?: string;
}

export interface DialogRowLike {
  id?: string;
  status?: string;
  trigger_type?: string;
}

const FAIL_REASONS: Record<string, IntakeFailReason> = {
  failed: "error",
  rate_limited: "rate_limited",
  payment_required: "payment_required",
};

export function assetRowToSignal(event: RealtimeEvent, row: AssetRowLike): EntitySignal | null {
  if (event === "INSERT") {
    return { kind: "intake.started", inputType: row.file_type };
  }
  if (row.processing_status === "processing" || row.understanding_status === "running") {
    return { kind: "intake.progress" };
  }
  const us = row.understanding_status;
  if (us && us in FAIL_REASONS) {
    return { kind: "intake.failed", reason: FAIL_REASONS[us], assetId: row.id };
  }
  if (us === "empty") {
    return { kind: "intake.empty" };
  }
  if (us === "review_ready") {
    // Terminaler Erfolg: das war bisher `null` → kein idle-Signal → busy hing bis
    // Reload. Jetzt explizit auflösen (machine: processing→idle, review-ready bleibt).
    return { kind: "intake.done", assetId: row.id };
  }
  return null;
}

export function dialogRowToSignal(event: RealtimeEvent, row: DialogRowLike): EntitySignal | null {
  if (event === "INSERT") {
    if (row.status === "open" && row.trigger_type === "intake" && row.id) {
      return { kind: "review.ready", sessionId: row.id };
    }
    return null;
  }
  if (row.status === "completed" || row.status === "cancelled") {
    return { kind: "review.dismissed" };
  }
  return null;
}
