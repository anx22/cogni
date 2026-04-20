// =============================================================================
//  loadSession — lädt eine echte Dialog-Session aus der Datenbank.
//  Mappt review_cases → DialogBox (UI-Form).
// =============================================================================

import { supabase } from "@/integrations/supabase/client";
import type { DialogBox, DialogSession } from "./types";
import { dbBoxTypeToUI } from "./boxMapping";

export async function loadDialogSession(sessionId: string): Promise<DialogSession | null> {
  const { data: session, error: sErr } = await supabase
    .from("dialog_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (sErr || !session) return null;

  const { data: cases, error: cErr } = await supabase
    .from("review_cases")
    .select("*")
    .eq("session_id", sessionId)
    .order("priority", { ascending: false });
  if (cErr) return null;

  const boxes: DialogBox[] = (cases ?? []).map((c) => {
    const ctx = (c.context ?? {}) as { fact_type?: string; content?: Record<string, unknown> };
    const content = ctx.content ?? {};
    return {
      id: c.id,
      type: dbBoxTypeToUI(c.box_type),
      state: c.box_state as DialogBox["state"],
      title: c.title ?? "(ohne Titel)",
      payload: {
        // gemeinsame Felder für die existierenden Boxen-Renderer:
        sachverhalt: c.description ?? "",
        // Zusatzinfos für spezialisierte Boxen
        factType: ctx.fact_type,
        content,
        // Konflikt: Varianten kommen später aus against_fact + content
        beschreibung: c.description ?? "",
        // Gap
        wirkung: typeof content.impact === "string" ? content.impact : undefined,
        // Quelle (V1: wir setzen den DB-Hinweis als Quelle)
        quelle: ctx.fact_type ? `vorgeschlagen · ${ctx.fact_type}` : "vorgeschlagen",
        // Persistenz-Marker — wird vom Provider erkannt
        __reviewCaseId: c.id,
      },
    };
  });

  return {
    id: session.id,
    anlass: session.summary ?? "Verstehens-Lauf",
    context: session.trigger_type,
    boxes,
  };
}

export async function loadLatestOpenSession(userId: string): Promise<DialogSession | null> {
  const { data, error } = await supabase
    .from("dialog_sessions")
    .select("id")
    .eq("user_id", userId)
    .in("status", ["open", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return loadDialogSession(data.id);
}
