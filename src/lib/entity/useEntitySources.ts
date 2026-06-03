// =============================================================================
//  Entity-Core — Realtime-Subscription + Timers + Auto-open-Dedup.
//  Einzige Stelle, die auf Supabase-Events hört und in EntitySignals übersetzt.
//  Timers (settle, auto-open) leben hier — nicht in Komponenten.
// =============================================================================

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeTables, type RealtimeListener } from "@/lib/realtime/useRealtimeTables";
import { devlog } from "@/lib/devlog/devlog";
import {
  assetRowToSignal,
  dialogRowToSignal,
  type AssetRowLike,
  type DialogRowLike,
} from "./signalMapping";
import { entitySignal } from "./signals";
import type { EntitySignal } from "./types";

export function useEntitySources(
  dispatch: (sig: EntitySignal) => void,
  autoOpenHandlerRef: RefObject<((sessionId: string) => void) | null>,
): { openPendingSession: () => void } {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  const pendingSessionIdRef = useRef<string | null>(null);
  const autoOpenedRef = useRef<Set<string>>(new Set());
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      if (autoOpenTimerRef.current) clearTimeout(autoOpenTimerRef.current);
    };
  }, []);

  const openPendingSession = useCallback(() => {
    const sessionId = pendingSessionIdRef.current;
    if (!sessionId) return;
    if (autoOpenTimerRef.current) {
      clearTimeout(autoOpenTimerRef.current);
      autoOpenTimerRef.current = null;
    }
    autoOpenHandlerRef.current?.(sessionId);
    pendingSessionIdRef.current = null;
    dispatchRef.current(entitySignal.reviewOpened(sessionId));
  }, [autoOpenHandlerRef]);

  const listeners = useMemo<RealtimeListener[]>(() => {
    if (!userId) return [];
    const filter = `user_id=eq.${userId}`;
    return [
      {
        table: "assets",
        event: "INSERT",
        filter,
        handler: (payload) => {
          const row = payload.new as AssetRowLike;
          devlog.realtime(`assets INSERT → ${row.file_type}`, { id: row.id });
          const sig = assetRowToSignal("INSERT", row);
          if (sig) dispatchRef.current(sig);
        },
      },
      {
        table: "assets",
        event: "UPDATE",
        filter,
        handler: (payload) => {
          const row = payload.new as AssetRowLike;
          const sig = assetRowToSignal("UPDATE", row);
          if (!sig) return;
          if (sig.kind === "intake.empty") {
            // Grace period before going idle — keeps processing visual a moment longer.
            if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
            settleTimerRef.current = setTimeout(() => {
              dispatchRef.current(entitySignal.intakeSettle());
              settleTimerRef.current = null;
            }, 1500);
          } else {
            dispatchRef.current(sig);
          }
        },
      },
      {
        table: "dialog_sessions",
        event: "INSERT",
        filter,
        handler: (payload) => {
          const row = payload.new as DialogRowLike;
          devlog.realtime(`dialog_session INSERT → ${row.status}`, { id: row.id });
          const sig = dialogRowToSignal("INSERT", row);
          if (!sig || sig.kind !== "review.ready") return;
          if (autoOpenedRef.current.has(sig.sessionId)) return;
          autoOpenedRef.current.add(sig.sessionId);
          pendingSessionIdRef.current = sig.sessionId;
          dispatchRef.current(sig);
          const sessionId = sig.sessionId;
          if (autoOpenTimerRef.current) clearTimeout(autoOpenTimerRef.current);
          autoOpenTimerRef.current = setTimeout(() => {
            if (pendingSessionIdRef.current === sessionId) {
              autoOpenHandlerRef.current?.(sessionId);
              pendingSessionIdRef.current = null;
              dispatchRef.current(entitySignal.reviewOpened(sessionId));
            }
            autoOpenTimerRef.current = null;
          }, 1400);
        },
      },
      {
        table: "dialog_sessions",
        event: "UPDATE",
        filter,
        handler: (payload) => {
          const row = payload.new as DialogRowLike;
          const sig = dialogRowToSignal("UPDATE", row);
          if (sig) dispatchRef.current(sig);
        },
      },
    ];
  }, [userId, autoOpenHandlerRef]);

  useRealtimeTables(userId ? `entity-sources-${userId}` : null, listeners);

  return { openPendingSession };
}
