// =============================================================================
//  inspect-graphiti / diagnose — Pure-Aggregation für graphiti_sync_log.
// -----------------------------------------------------------------------------
//  Reason-Normalisierung: erste Zeile, UUIDs/Numbers → Platzhalter, max 80
//  Zeichen. Damit fallen typische dynamische Anteile (request-id, status-code)
//  in einen gemeinsamen Bucket.
// =============================================================================

export type FailedRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  error: string | null;
  created_at: string;
};

export type FailedReasonGroup = {
  reason: string;
  count: number;
  sample_entity_id: string;
  sample_entity_type: string;
  latest_at: string;
};

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const LONG_DIGITS_RE = /\b\d{3,}\b/g;

export function normalizeReason(err: string | null | undefined): string {
  if (!err) return "(kein Fehlertext)";
  const firstLine = err.split(/\r?\n/)[0]?.trim() ?? "";
  if (!firstLine) return "(leer)";
  const masked = firstLine.replace(UUID_RE, "<uuid>").replace(LONG_DIGITS_RE, "<n>").trim();
  return masked.length > 80 ? `${masked.slice(0, 77)}…` : masked;
}

export function groupFailedReasons(rows: FailedRow[]): FailedReasonGroup[] {
  const acc = new Map<string, FailedReasonGroup>();
  for (const r of rows) {
    const reason = normalizeReason(r.error);
    const prev = acc.get(reason);
    if (!prev) {
      acc.set(reason, {
        reason,
        count: 1,
        sample_entity_id: r.entity_id,
        sample_entity_type: r.entity_type,
        latest_at: r.created_at,
      });
    } else {
      prev.count += 1;
      if (r.created_at > prev.latest_at) {
        prev.latest_at = r.created_at;
        prev.sample_entity_id = r.entity_id;
        prev.sample_entity_type = r.entity_type;
      }
    }
  }
  return [...acc.values()].sort((a, b) => b.count - a.count || (a.reason < b.reason ? -1 : 1));
}
