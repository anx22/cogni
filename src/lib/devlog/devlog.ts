/**
 * devlog — Dev-only Transparenz-Layer
 *
 * Singleton-Ringbuffer mit Subscriber-Pattern.
 * Aktiv nur wenn import.meta.env.DEV. In Production sind alle Calls No-Ops
 * (kein Speicher, kein console-Spam).
 *
 * Erweiterbar:
 * - Neue Kategorien: einfach in DevLogCategory ergänzen + Farbe in CATEGORY_COLOR
 * - Auto-Capture globaler Errors via attachGlobalErrorHandlers()
 * - Spätere Persistenz: addSink() registriert beliebigen Listener
 *   (z.B. Supabase-Insert, IndexedDB, WebSocket-Stream)
 */

export type DevLogCategory = "intake" | "db" | "edge" | "realtime" | "auth" | "ui" | "error";

export type DevLogLevel = "debug" | "info" | "warn" | "error";

export interface DevLogEntry {
  id: string;
  ts: number;
  category: DevLogCategory;
  level: DevLogLevel;
  message: string;
  payload?: unknown;
}

export type DevLogSink = (entry: DevLogEntry) => void;

const MAX_ENTRIES = 500;
const IS_DEV = typeof import.meta !== "undefined" && import.meta.env?.DEV === true;

class DevLog {
  private entries: DevLogEntry[] = [];
  private subscribers = new Set<() => void>();
  private sinks = new Set<DevLogSink>();
  private paused = false;
  private seq = 0;

  get isEnabled() {
    return IS_DEV;
  }

  subscribe(fn: () => void): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  /** Externe Senke registrieren (z.B. DB-Persistenz) */
  addSink(sink: DevLogSink): () => void {
    this.sinks.add(sink);
    return () => this.sinks.delete(sink);
  }

  getSnapshot(): DevLogEntry[] {
    return this.entries;
  }

  setPaused(p: boolean) {
    this.paused = p;
    this.notify();
  }

  isPaused() {
    return this.paused;
  }

  clear() {
    this.entries = [];
    this.notify();
  }

  log(category: DevLogCategory, message: string, payload?: unknown, level: DevLogLevel = "info") {
    if (!IS_DEV || this.paused) return;

    const entry: DevLogEntry = {
      id: `${Date.now()}-${++this.seq}`,
      ts: Date.now(),
      category,
      level,
      message,
      payload: payload === undefined ? undefined : safeClone(payload),
    };

    // Append + Trim (neuer Array-Ref für React)
    const next =
      this.entries.length >= MAX_ENTRIES
        ? [...this.entries.slice(-(MAX_ENTRIES - 1)), entry]
        : [...this.entries, entry];
    this.entries = next;

    // Browser-DevTools-Spiegel
    const tag = `%c[${category}]`;
    const style = `color:${CATEGORY_COLOR[category]};font-weight:600`;
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.debug;
    if (payload !== undefined) fn(tag, style, message, payload);
    else fn(tag, style, message);

    // Sinks
    for (const sink of this.sinks) {
      try {
        sink(entry);
      } catch {
        /* ignore */
      }
    }

    this.notify();
  }

  // Convenience-API
  intake = (msg: string, payload?: unknown) => this.log("intake", msg, payload);
  db = (msg: string, payload?: unknown) => this.log("db", msg, payload);
  edge = (msg: string, payload?: unknown) => this.log("edge", msg, payload);
  realtime = (msg: string, payload?: unknown) => this.log("realtime", msg, payload);
  auth = (msg: string, payload?: unknown) => this.log("auth", msg, payload);
  ui = (msg: string, payload?: unknown) => this.log("ui", msg, payload);
  warn = (category: DevLogCategory, msg: string, payload?: unknown) =>
    this.log(category, msg, payload, "warn");
  error = (msg: string, payload?: unknown) => this.log("error", msg, payload, "error");

  private notify() {
    for (const fn of this.subscribers) fn();
  }
}

export const CATEGORY_COLOR: Record<DevLogCategory, string> = {
  intake: "#7dd3fc", // sky-300
  db: "#a78bfa", // violet-400
  edge: "#fbbf24", // amber-400
  realtime: "#34d399", // emerald-400
  auth: "#f472b6", // pink-400
  ui: "#94a3b8", // slate-400
  error: "#f87171", // red-400
};

function safeClone(v: unknown): unknown {
  try {
    if (v instanceof Error) {
      return { name: v.name, message: v.message, stack: v.stack };
    }
    return JSON.parse(JSON.stringify(v));
  } catch {
    return String(v);
  }
}

export const devlog = new DevLog();

// Global Error Handlers — einmal beim App-Start aufrufen
let globalAttached = false;
export function attachGlobalErrorHandlers() {
  if (globalAttached || !IS_DEV || typeof window === "undefined") return;
  globalAttached = true;
  window.addEventListener("error", (e) => {
    devlog.error(`window.error: ${e.message}`, {
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      stack: e.error?.stack,
    });
  });
  window.addEventListener("unhandledrejection", (e) => {
    devlog.error("unhandledrejection", { reason: e.reason });
  });
}

// Dev-only: in window für manuelle Konsolen-Inspektion
if (IS_DEV && typeof window !== "undefined") {
  (window as unknown as { devlog: DevLog }).devlog = devlog;
}
