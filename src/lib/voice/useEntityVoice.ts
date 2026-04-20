// =============================================================================
//  useEntityVoice — komponiert die "Live-Stimme" aus Realtime-Events.
// -----------------------------------------------------------------------------
//  Pattern: Event → Satz (deterministisch im Frontend, kein Agent-Roundtrip).
//  Jeder Satz hat eine Mindest-Anzeigedauer; eine kleine Queue verhindert
//  Flackern bei mehreren gleichzeitigen Events.
// =============================================================================

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type UnderstandingStatus =
  | "pending" | "running" | "empty" | "review_ready"
  | "failed" | "rate_limited" | "payment_required";

export interface VoiceState {
  text: string | null;
  tone: "calm" | "working" | "ready" | "alert";
  retryAssetId?: string | null;
}

const MIN_DISPLAY_MS = 1500;

export function useEntityVoice(userId: string | undefined) {
  const [state, setState] = useState<VoiceState>({ text: null, tone: "calm" });
  const lastShownAt = useRef(0);
  const queue = useRef<VoiceState[]>([]);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enqueue = (next: VoiceState) => {
    queue.current.push(next);
    drain();
  };

  const drain = () => {
    if (queue.current.length === 0) return;
    const now = Date.now();
    const wait = Math.max(0, MIN_DISPLAY_MS - (now - lastShownAt.current));
    setTimeout(() => {
      const next = queue.current.shift();
      if (!next) return;
      lastShownAt.current = Date.now();
      setState(next);
      if (clearTimer.current) clearTimeout(clearTimer.current);
      // Auto-Clear nach 8s, falls "ready" landet und nichts Neues kommt.
      if (next.tone === "ready" && next.text) {
        clearTimer.current = setTimeout(() => {
          setState({ text: null, tone: "calm" });
        }, 8000);
      }
      if (queue.current.length > 0) drain();
    }, wait);
  };

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("entity-voice")
      // Asset-Insert (Drop, Notiz, Link)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "assets", filter: `user_id=eq.${userId}` },
        (p) => {
          const row = p.new as { file_type?: string };
          const what =
            row.file_type === "note" ? "deine Notiz"
            : row.file_type === "other" ? "deinen Input"
            : "deine Datei";
          enqueue({ text: `Ich nehme ${what} auf.`, tone: "working" });
        },
      )
      // Asset-Update (Status-Spur)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "assets", filter: `user_id=eq.${userId}` },
        (p) => {
          const row = p.new as {
            id: string;
            understanding_status?: UnderstandingStatus;
            file_type?: string;
            processing_status?: string;
          };
          if (row.processing_status === "processing") {
            enqueue({
              text: row.file_type === "note" ? "Ich lese deine Notiz." : "Ich lese gerade dein Dokument.",
              tone: "working",
            });
          }
          switch (row.understanding_status) {
            case "running":
              enqueue({ text: "Ich verstehe gerade.", tone: "working" });
              break;
            case "empty":
              enqueue({ text: "Nichts Neues entdeckt — Original ist gespeichert.", tone: "calm" });
              break;
            case "failed":
              enqueue({
                text: "Das hat nicht geklappt — nochmal?",
                tone: "alert",
                retryAssetId: row.id,
              });
              break;
            case "rate_limited":
              enqueue({
                text: "Bin gerade überlastet — gleich nochmal?",
                tone: "alert",
                retryAssetId: row.id,
              });
              break;
            case "payment_required":
              enqueue({
                text: "Mir gehen die Credits aus.",
                tone: "alert",
                retryAssetId: row.id,
              });
              break;
          }
        },
      )
      // Erster proposed_fact eines Laufs
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "proposed_facts", filter: `user_id=eq.${userId}` },
        () => {
          enqueue({ text: "Ich erkenne etwas.", tone: "working" });
        },
      )
      // Session offen → bereit
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dialog_sessions", filter: `user_id=eq.${userId}` },
        (p) => {
          const row = p.new as { total_boxes?: number; metadata?: any };
          const n = row.total_boxes ?? 0;
          const reason = row.metadata?.assignment?.agent_reason as string | undefined;
          if (reason) {
            enqueue({ text: reason, tone: "ready" });
          } else {
            enqueue({
              text: `Bereit. ${n} ${n === 1 ? "Sache" : "Sachen"} für dich.`,
              tone: "ready",
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return state;
}
