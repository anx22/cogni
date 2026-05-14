// =============================================================================
//  loadSession — lädt eine echte Dialog-Session aus der Datenbank.
//  Mappt review_cases → DialogBox (UI-Form).
//  Setzt mode (edit | readonly) anhand status + Boxenzustand.
// =============================================================================

import { supabase } from "@/integrations/supabase/client";
import type { DialogBox, DialogSession, BoxState } from "./types";
import { dbBoxTypeToUI } from "./boxMapping";
import { deriveSessionMode } from "./sessionMode";

const DB_TO_UI_STATE: Record<string, BoxState> = {
  proposed: "vorgeschlagen",
  expanded: "aufgeklappt",
  modified: "geaendert",
  confirmed: "bestaetigt",
  rejected: "verworfen",
  escalated: "eskaliert",
};

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
    const ctx = (c.context ?? {}) as Record<string, unknown>;
    const factType = ctx.fact_type as string | undefined;
    const content = (ctx.content ?? {}) as Record<string, unknown>;

    if (c.box_type === "assignment") {
      const candidates = (ctx.candidates ?? []) as {
        project_id: string;
        name: string;
        score: number;
        reasons: string[];
      }[];
      return {
        id: c.id,
        type: "zuordnung",
        state: DB_TO_UI_STATE[c.box_state] ?? "vorgeschlagen",
        title: c.title ?? "Projektzuordnung",
        payload: {
          assignment_mode: ctx.assignment_mode,
          candidates,
          suggested_new_name: ctx.suggested_new_name,
          agent_reason: ctx.agent_reason,
          asset_id: ctx.asset_id,
          frage: c.description ?? "Welches Projekt passt?",
          __reviewCaseId: c.id,
        },
      };
    }

    return {
      id: c.id,
      type: dbBoxTypeToUI(c.box_type),
      state: DB_TO_UI_STATE[c.box_state] ?? "vorgeschlagen",
      title: c.title ?? "(ohne Titel)",
      payload: {
        sachverhalt: c.description ?? "",
        factType,
        content,
        beschreibung: c.description ?? "",
        wirkung: typeof content.impact === "string" ? content.impact : undefined,
        quelle: factType ? `vorgeschlagen · ${factType}` : "vorgeschlagen",
        __reviewCaseId: c.id,
      },
    };
  });

  const mode = deriveSessionMode(session.status, boxes);

  let projectName: string | null = null;
  if (session.project_id) {
    const { data: proj } = await supabase
      .from("projects")
      .select("name")
      .eq("id", session.project_id)
      .maybeSingle();
    projectName = proj?.name ?? null;
  }

  return {
    id: session.id,
    anlass: session.summary ?? "Verstehens-Lauf",
    context: session.trigger_type,
    boxes,
    mode,
    closedAt: mode === "readonly" ? session.updated_at : null,
    projectId: session.project_id ?? null,
    projectName,
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
