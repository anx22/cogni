// =============================================================================
//  reopenEscalated — einen zurückgestellten (eskalierten) Review-Case
//  wieder in den entscheidbaren Zustand holen.
//
//  Schließt das S8-Versprechen: „Kann später erneut geöffnet werden". Vorher
//  landete ein eskalierter Case in einem readonly-Limbo (Session = completed,
//  Case = escalated, nirgends im Projektzustand sichtbar).
//
//  Reopen kehrt das um:
//   - review_case.box_state: escalated → proposed (wieder entscheidbar)
//   - dialog_session.status zurück auf in_progress (nicht mehr readonly)
//   - Fortschrittszähler (resolved/total) neu berechnet
//
//  Die reine Zähl-Logik (deriveSessionProgress) ist isoliert + unit-getestet
//  und wird auch vom Escalate-Handler im DialogProvider genutzt (kein Drift).
// =============================================================================

import { supabase } from "@/integrations/supabase/client";

/** box_states, die als „erledigt" (resolved) für den Session-Fortschritt zählen. */
const RESOLVED_STATES = ["confirmed", "rejected", "escalated"];

export interface SessionProgress {
  total: number;
  resolved: number;
  status: "in_progress" | "completed";
}

/**
 * Reiner Fortschritts-Reducer für eine Dialog-Session.
 * Eine Session ist `completed`, sobald alle Boxen resolved sind — sonst
 * `in_progress`. Identisch zur Logik des Escalate-Pfads (Single Source).
 */
export function deriveSessionProgress(boxStates: string[]): SessionProgress {
  const total = boxStates.length;
  const resolved = boxStates.filter((s) => RESOLVED_STATES.includes(s)).length;
  return {
    total,
    resolved,
    status: total > 0 && resolved >= total ? "completed" : "in_progress",
  };
}

/**
 * Holt einen eskalierten Case zurück in den Review. Gibt true bei Erfolg.
 * Seiteneffekte (Supabase) bewusst hier; der Aufrufer öffnet danach die Session.
 */
export async function reopenEscalatedCase(caseId: string, sessionId: string): Promise<boolean> {
  const { error: upErr } = await supabase
    .from("review_cases")
    .update({ box_state: "proposed" })
    .eq("id", caseId);
  if (upErr) return false;

  // Session-Fortschritt nachziehen: der reaktivierte Case ist wieder offen,
  // also fällt die Session zurück auf in_progress (verlässt den readonly-Zustand).
  const { data: stats } = await supabase
    .from("review_cases")
    .select("box_state")
    .eq("session_id", sessionId);
  const progress = deriveSessionProgress((stats ?? []).map((c) => c.box_state as string));

  await supabase
    .from("dialog_sessions")
    .update({
      resolved_boxes: progress.resolved,
      total_boxes: progress.total,
      status: progress.status,
    })
    .eq("id", sessionId);

  return true;
}
