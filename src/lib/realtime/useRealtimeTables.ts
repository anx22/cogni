// =============================================================================
//  useRealtimeTables — Zentrales Channel-/Subscription-Boilerplate.
// -----------------------------------------------------------------------------
//  Ersetzt das wiederholte Muster:
//    const ch = supabase.channel(name).on('postgres_changes', {...}, cb).subscribe()
//    return () => supabase.removeChannel(ch)
//
//  Features:
//   - Mehrere Tabellen pro Channel.
//   - Per-Listener-Handler (bekommt Payload) UND/ODER globaler `onTrigger`.
//   - Optionales Debounce für `onTrigger` (default: 0 = aus).
//   - `enabled` und `channelName=null` deaktivieren das Subscribe.
//   - Listener-Array wird absichtlich NICHT in der Effect-Dependency überwacht
//     (sonst würde jeder Render neu subscriben). Stattdessen Ref-Pattern.
// =============================================================================

import { useEffect, useId, useRef } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type RealtimeEvent = "*" | "INSERT" | "UPDATE" | "DELETE";

export interface RealtimeListener {
  table: string;
  event?: RealtimeEvent;
  schema?: string;
  filter?: string;
  handler?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
}

export interface UseRealtimeTablesOptions {
  onTrigger?: () => void;
  debounceMs?: number;
  enabled?: boolean;
}

export function useRealtimeTables(
  channelName: string | null | undefined,
  listeners: RealtimeListener[],
  options: UseRealtimeTablesOptions = {},
): void {
  const { onTrigger, debounceMs = 0, enabled = true } = options;
  // React-stabile, instanz-eindeutige Suffix verhindert Channel-Kollisionen,
  // wenn mehrere Komponenten denselben logischen Channel-Namen nutzen
  // (z. B. zwei Hooks mit `projects-list-${userId}`). Supabase Realtime erlaubt
  // pro `channel(name)` nur einen `.subscribe()`-Lebenszyklus.
  const instanceId = useId();
  const fullChannelName = channelName ? `${channelName}::${instanceId}` : null;

  // Refs damit wir nicht bei jedem Render neu subscriben.
  const listenersRef = useRef(listeners);
  const onTriggerRef = useRef(onTrigger);
  listenersRef.current = listeners;
  onTriggerRef.current = onTrigger;

  useEffect(() => {
    if (!enabled || !fullChannelName || listenersRef.current.length === 0) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const fireTrigger = () => {
      const cb = onTriggerRef.current;
      if (!cb) return;
      if (debounceMs > 0) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(cb, debounceMs);
      } else {
        cb();
      }
    };

    const channel = supabase.channel(fullChannelName);
    listenersRef.current.forEach((l) => {
      channel.on(
        "postgres_changes",
        {
          event: l.event ?? "*",
          schema: l.schema ?? "public",
          table: l.table,
          ...(l.filter ? { filter: l.filter } : {}),
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          l.handler?.(payload);
          fireTrigger();
        },
      );
    });
    channel.subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
    // channelName + enabled + debounceMs sind die Re-Subscribe-Trigger.
  }, [fullChannelName, enabled, debounceMs]);
}
