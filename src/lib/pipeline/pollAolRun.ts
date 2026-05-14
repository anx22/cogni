// =============================================================================
//  pollAolRun
// -----------------------------------------------------------------------------
//  Pollt eine Zeile in `aol_runs` so lange, bis sie einen Endzustand erreicht
//  (`completed` | `failed`) oder das Timeout abläuft. RLS sorgt dafür, dass nur
//  der eigene Run abgefragt werden kann — kein Service-Key nötig.
//
//  Vertrag:
//    - Aufruf nach `intake-trigger`, das die `run_id` synchron zurückgibt
//    - `onUpdate` bei jedem Status-/Node-Wechsel
//    - Auflösung sobald terminal oder Timeout
// =============================================================================

import { supabase } from "@/integrations/supabase/client";
import { devlog } from "@/lib/devlog/devlog";

export type AolRunStatus = "pending" | "running" | "completed" | "failed";

export interface AolRunSnapshot {
  id: string;
  status: AolRunStatus;
  current_node: string | null;
  error: { message?: string } | null;
  started_at: string | null;
  ended_at: string | null;
  metadata: Record<string, unknown> | null;
}

const TERMINAL: AolRunStatus[] = ["completed", "failed"];

export interface PollOptions {
  /** Polling-Intervall in ms. Default 1500. */
  intervalMs?: number;
  /** Hartes Timeout in ms. Default 120_000 (2 Min). */
  timeoutMs?: number;
  /** Wird bei jedem (geänderten) Snapshot gefeuert. */
  onUpdate?: (snap: AolRunSnapshot) => void;
  /** Optionaler AbortSignal-Hook, um vorzeitig zu stoppen. */
  signal?: AbortSignal;
}

export interface PollResult {
  status: AolRunStatus | "timeout" | "aborted";
  snapshot: AolRunSnapshot | null;
}

export async function pollAolRun(
  runId: string,
  opts: PollOptions = {},
): Promise<PollResult> {
  const intervalMs = opts.intervalMs ?? 1500;
  const timeoutMs = opts.timeoutMs ?? 120_000;
  const start = Date.now();
  let lastSerialized = "";
  let lastSnap: AolRunSnapshot | null = null;

  devlog.edge("pollAolRun:start", { runId, intervalMs, timeoutMs });

  while (true) {
    if (opts.signal?.aborted) {
      devlog.edge("pollAolRun:aborted", { runId });
      return { status: "aborted", snapshot: lastSnap };
    }

    const { data, error } = await supabase
      .from("aol_runs")
      .select("id, status, current_node, error, started_at, ended_at, metadata")
      .eq("id", runId)
      .maybeSingle();

    if (error) {
      // RLS-/Netzfehler: nicht abbrechen, weiter pollen, aber loggen
      devlog.warn("pollAolRun query error", error.message);
    } else if (data) {
      const snap = data as AolRunSnapshot;
      const serialized = JSON.stringify([snap.status, snap.current_node, snap.ended_at]);
      if (serialized !== lastSerialized) {
        lastSerialized = serialized;
        lastSnap = snap;
        opts.onUpdate?.(snap);
        devlog.edge("pollAolRun:tick", {
          runId,
          status: snap.status,
          node: snap.current_node,
        });
      }
      if (TERMINAL.includes(snap.status)) {
        return { status: snap.status, snapshot: snap };
      }
    }

    if (Date.now() - start >= timeoutMs) {
      devlog.warn("pollAolRun timeout", `${runId} after ${timeoutMs}ms`);
      return { status: "timeout", snapshot: lastSnap };
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
