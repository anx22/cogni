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
      const errorJson = isPlainObject(errorPayload) ? (errorPayload as Record<string, unknown>) : null;

      await supabase.from("pipeline_events").insert({
        user_id: userId,
        fn: "frontend",
        stage: entry.category,
        level: entry.level,
        correlation_id: newCorrelationId(),
        message: entry.message ?? null,
        payload: rest as Record<string, unknown>,
        error: errorJson,
      });
    } catch {
      /* swallow */
    }
  });
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
