// =============================================================================
//  submitNote — User-Text als Notiz-Asset persistieren + verstehens-pipeline.
//
//  Geteilt zwischen `useIntake` (Home/Project-Drop) und Dialog-Sessions, die
//  per `__submitIntent: { kind: "intake_note" }` einen Antwort-/Feedback-/
//  Rückfrage-Text einsammeln (Handlungsbedarf, Feedback, Rückfrage-Sessions).
//
//  Schreibt nach `assets` (file_type='note', metadata.kind='note') und triggert
//  intake-trigger. Die Polling-/Tracking-Logik bleibt beim Caller — diese
//  Funktion ist purer Side-Effect ohne UI-State.
// =============================================================================
import { supabase } from "@/integrations/supabase/client";
import { devlog } from "@/lib/devlog/devlog";

export interface SubmitNoteOptions {
  projectId?: string | null;
  /** Hint für die Verstehens-Pipeline, z. B. "Antwort auf: <Handlungsbedarf-Titel>" */
  contextHint?: string;
  /** Rückreferenz auf das auslösende Objekt (handlungsbedarf-id, etc.) */
  sourceRef?: { type: string; id?: string; quelle?: string };
}

export interface SubmitNoteResult {
  assetId: string;
  runId: string | null;
}

export async function submitNote(
  text: string,
  options: SubmitNoteOptions = {},
): Promise<SubmitNoteResult | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    devlog.warn("submitNote", "aborted — no user");
    return null;
  }
  const trimmed = text.trim();
  if (!trimmed) return null;

  const preview = trimmed.slice(0, 60);
  const { data, error } = await supabase
    .from("assets")
    .insert({
      user_id: user.id,
      file_name: preview,
      file_type: "note",
      processing_status: "completed",
      understanding_status: "pending",
      project_id: options.projectId ?? null,
      metadata: {
        kind: "note",
        text: trimmed,
        context_hint: options.contextHint ?? null,
        source_ref: options.sourceRef ?? null,
      },
    })
    .select("id")
    .single();
  if (error || !data) {
    devlog.error("submitNote: asset insert failed", error);
    return null;
  }
  devlog.db("submitNote: asset inserted", { id: data.id, length: trimmed.length });

  const { data: runRes, error: runErr } = await supabase.functions.invoke("intake-trigger", {
    body: { asset_id: data.id },
  });
  if (runErr) {
    devlog.error("submitNote: intake-trigger error", runErr);
    return { assetId: data.id, runId: null };
  }
  const runId = (runRes as { run_id?: string } | null)?.run_id ?? null;
  devlog.edge("submitNote: intake-trigger responded", { assetId: data.id, runId });
  return { assetId: data.id, runId };
}
