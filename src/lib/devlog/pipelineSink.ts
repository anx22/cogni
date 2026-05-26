/**
 * pipelineSink — verbindet das dev-only `devlog` mit der DB-Tabelle
 * `pipeline_events`. Schreibt ausschließlich `warn`/`error`-Einträge,
 * damit kein Datenrauschen entsteht. Best-Effort: Fehler beim Insert
 * werden geschluckt — ein Logger darf den Hauptpfad nie killen.
 *
 * Aktivierung erfolgt einmal beim App-Start via `attachPipelineSink()`.
 * In Production no-op (devlog ist dort sowieso inaktiv).
 */
import { supabase } from "@/integrations/supabase/client";
import { devlog, type DevLogEntry } from "./devlog";

let attached = false;

function newCorrelationId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function attachPipelineSink() {
  if (attached || !devlog.isEnabled) return;
  attached = true;

  devlog.addSink(async (entry: DevLogEntry) => {
    if (entry.level !== "warn" && entry.level !== "error") return;
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return; // RLS verlangt user_id == auth.uid()

      const payload = isPlainObject(entry.payload) ? entry.payload : { value: entry.payload };
      const { error: errorPayload, ...rest } = payload;
      const errorJson = isPlainObject(errorPayload)
        ? (errorPayload as Record<string, unknown>)
        : null;

      const row: Record<string, unknown> = {
        user_id: userId,
        fn: "frontend",
        stage: entry.category,
        level: entry.level,
        correlation_id: newCorrelationId(),
        payload: rest as Record<string, unknown>,
      };
      if (entry.message) row.message = entry.message;
      if (errorJson) row.error = errorJson;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from("pipeline_events").insert(row as any);
    } catch {
      /* swallow */
    }
  });
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
