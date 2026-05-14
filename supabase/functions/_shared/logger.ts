// =============================================================================
//  _shared/logger.ts — strukturierter Pipeline-Logger
// -----------------------------------------------------------------------------
//  Verwendung pro Edge-Function:
//
//    const log = createLogger({ fn: "commit-fact", userId, assetId, runId });
//    await log.stage("start", "incoming request", { body });
//    try {
//      ...
//      await log.stage("graphiti.message", "mirror sent", { uuid });
//    } catch (err) {
//      await log.error("graphiti.message", "mirror failed", err);
//      throw err;
//    }
//    await log.stage("done", "ok", { facts_written });
//    await log.flush();
//
//  Logger spiegelt parallel auf console (für Supabase Function-Logs) und sammelt
//  Events für einen gebündelten Insert in `pipeline_events`. Fehler beim Schreiben
//  werden geschluckt (Logger darf den Hauptpfad nie killen).
// =============================================================================

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LoggerCtx {
  fn: string;
  userId?: string | null;
  correlationId?: string;
  assetId?: string | null;
  runId?: string | null;
  sessionId?: string | null;
  projectId?: string | null;
  /** Wenn gesetzt, wird dieser Client verwendet — sonst Service-Role neu erzeugt. */
  client?: SupabaseClient;
}

interface PendingEvent {
  ts: string;
  fn: string;
  stage: string;
  level: LogLevel;
  correlation_id: string | null;
  user_id: string | null;
  asset_id: string | null;
  run_id: string | null;
  session_id: string | null;
  project_id: string | null;
  duration_ms: number | null;
  message: string | null;
  payload: Record<string, unknown>;
  error: Record<string, unknown> | null;
}

function newCorrelationId() {
  return (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  if (typeof err === "object" && err !== null) return err as Record<string, unknown>;
  return { message: String(err) };
}

export interface Logger {
  readonly correlationId: string;
  /** Kontext nachträglich anreichern (z.B. assetId nach DB-Lookup). */
  bind(patch: Partial<LoggerCtx>): void;
  stage(stage: string, message?: string, payload?: Record<string, unknown>): void;
  warn(stage: string, message: string, payload?: Record<string, unknown>): void;
  error(stage: string, message: string, err: unknown, payload?: Record<string, unknown>): void;
  /** Misst Dauer eines Sub-Steps und loggt am Ende automatisch. */
  time<T>(stage: string, fn: () => Promise<T>, payload?: Record<string, unknown>): Promise<T>;
  /** Sendet alle gepufferten Events. Sollte am Ende jeder Request-Behandlung laufen. */
  flush(): Promise<void>;
}

export function createLogger(ctx: LoggerCtx): Logger {
  const state: Required<Omit<LoggerCtx, "client" | "correlationId">> & { correlationId: string; client?: SupabaseClient } = {
    fn: ctx.fn,
    userId: ctx.userId ?? null,
    correlationId: ctx.correlationId ?? newCorrelationId(),
    assetId: ctx.assetId ?? null,
    runId: ctx.runId ?? null,
    sessionId: ctx.sessionId ?? null,
    projectId: ctx.projectId ?? null,
    client: ctx.client,
  };

  const buffer: PendingEvent[] = [];
  const startedAt = Date.now();

  function getClient(): SupabaseClient | null {
    if (state.client) return state.client;
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return null;
    state.client = createClient(url, key);
    return state.client;
  }

  function push(level: LogLevel, stage: string, message: string | undefined, payload?: Record<string, unknown>, err?: unknown) {
    const evt: PendingEvent = {
      ts: new Date().toISOString(),
      fn: state.fn,
      stage,
      level,
      correlation_id: state.correlationId,
      user_id: state.userId,
      asset_id: state.assetId,
      run_id: state.runId,
      session_id: state.sessionId,
      project_id: state.projectId,
      duration_ms: Date.now() - startedAt,
      message: message ?? null,
      payload: payload ?? {},
      error: err !== undefined ? serializeError(err) : null,
    };
    buffer.push(evt);

    const tag = `[${state.fn}:${stage}] (${state.correlationId.slice(0, 8)})`;
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    if (err !== undefined) fn(tag, message ?? "", payload ?? {}, evt.error);
    else if (payload !== undefined) fn(tag, message ?? "", payload);
    else fn(tag, message ?? "");
  }

  return {
    get correlationId() { return state.correlationId; },
    bind(patch) {
      if (patch.userId !== undefined) state.userId = patch.userId ?? null;
      if (patch.assetId !== undefined) state.assetId = patch.assetId ?? null;
      if (patch.runId !== undefined) state.runId = patch.runId ?? null;
      if (patch.sessionId !== undefined) state.sessionId = patch.sessionId ?? null;
      if (patch.projectId !== undefined) state.projectId = patch.projectId ?? null;
      if (patch.correlationId) state.correlationId = patch.correlationId;
    },
    stage(stage, message, payload) { push("info", stage, message, payload); },
    warn(stage, message, payload) { push("warn", stage, message, payload); },
    error(stage, message, err, payload) { push("error", stage, message, payload, err); },
    async time(stage, fn, payload) {
      const t0 = Date.now();
      try {
        const result = await fn();
        push("info", stage, "ok", { ...(payload ?? {}), step_ms: Date.now() - t0 });
        return result;
      } catch (err) {
        push("error", stage, "failed", { ...(payload ?? {}), step_ms: Date.now() - t0 }, err);
        throw err;
      }
    },
    async flush() {
      if (buffer.length === 0) return;
      const client = getClient();
      if (!client) return;
      const rows = buffer.splice(0, buffer.length);
      try {
        const { error } = await client.from("pipeline_events").insert(rows);
        if (error) console.warn(`[logger:flush] insert failed: ${error.message}`);
      } catch (err) {
        console.warn("[logger:flush] threw", err);
      }
    },
  };
}
