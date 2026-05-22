// =============================================================================
//  graphiti-reconcile / retryFilter — pure selector for retry candidates
// -----------------------------------------------------------------------------
//  Aus failed-Sync-Log-Rows filtern, welche jetzt wiederversucht werden dürfen.
//  Reinerhalten als pure Function, damit der Pfad ohne DB-Roundtrip testbar ist.
// =============================================================================

export interface FailedSyncRow {
  entity_id: string;
  attempt: number | null;
  error: string | null;
  last_retry_at: string | null; // ISO timestamp
}

export interface RetryFilterOpts {
  /** Maximalzahl Versuche, danach permanent failed. Default 3. */
  max_attempts?: number;
  /** Cooldown in Minuten zwischen Retrys. Default 30. */
  retry_cooldown_min?: number;
  /** Substring-Match auf error (case-insensitive). Optional. */
  failed_reason_filter?: string;
  /** Referenz für "jetzt" — Test-Injection. Default Date.now(). */
  now?: Date;
}

export interface RetryDecision {
  eligible: FailedSyncRow[];
  skipped_by_attempt: number;
  skipped_by_cooldown: number;
  skipped_by_reason: number;
}

export function selectRetryCandidates(
  rows: FailedSyncRow[],
  opts: RetryFilterOpts = {},
): RetryDecision {
  const max_attempts = opts.max_attempts ?? 3;
  const cooldownMs = (opts.retry_cooldown_min ?? 30) * 60_000;
  const now = (opts.now ?? new Date()).getTime();
  const reasonFilter = opts.failed_reason_filter?.toLowerCase().trim() || null;

  const eligible: FailedSyncRow[] = [];
  let skipped_by_attempt = 0;
  let skipped_by_cooldown = 0;
  let skipped_by_reason = 0;

  for (const r of rows) {
    const attempt = r.attempt ?? 0;
    if (attempt >= max_attempts) {
      skipped_by_attempt++;
      continue;
    }
    if (r.last_retry_at) {
      const last = new Date(r.last_retry_at).getTime();
      if (Number.isFinite(last) && now - last < cooldownMs) {
        skipped_by_cooldown++;
        continue;
      }
    }
    if (reasonFilter) {
      const err = (r.error ?? "").toLowerCase();
      if (!err.includes(reasonFilter)) {
        skipped_by_reason++;
        continue;
      }
    }
    eligible.push(r);
  }

  return { eligible, skipped_by_attempt, skipped_by_cooldown, skipped_by_reason };
}
