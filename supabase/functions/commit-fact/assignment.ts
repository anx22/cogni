// =============================================================================
//  commit-fact / assignment — Sonderfall „Zuordnungsbox".
// =============================================================================
// deno-lint-ignore-file no-explicit-any

export async function handleAssignment(
  admin: any,
  user_id: string,
  rc: any,
  decision: "confirm" | "reject",
  user_decision?: Record<string, unknown> | null,
) {
  const ctx = (rc.context ?? {}) as any;
  const sessionMeta = (rc.session?.metadata ?? {}) as any;
  let chosenProjectId: string | null = null;

  if (decision === "confirm") {
    const ud = (user_decision ?? {}) as { project_id?: string; new_project_name?: string };
    if (ud.project_id) {
      chosenProjectId = ud.project_id;
    } else if (ud.new_project_name) {
      const { data: np, error: npErr } = await admin
        .from("projects")
        .insert({ user_id, name: ud.new_project_name })
        .select("id")
        .single();
      if (npErr) throw new Error(`Neues Projekt: ${npErr.message}`);
      chosenProjectId = np.id;
    } else if (ctx.assignment_mode === "auto" && ctx.candidates?.[0]?.project_id) {
      chosenProjectId = ctx.candidates[0].project_id;
    } else if (ctx.assignment_mode === "new" && ctx.suggested_new_name) {
      const { data: np, error: npErr } = await admin
        .from("projects")
        .insert({ user_id, name: ctx.suggested_new_name })
        .select("id")
        .single();
      if (npErr) throw new Error(`Neues Projekt: ${npErr.message}`);
      chosenProjectId = np.id;
    } else {
      throw new Error("Keine Projektwahl getroffen");
    }
  } else {
    await admin
      .from("review_cases")
      .update({ box_state: "rejected", user_decision: user_decision ?? { decision: "reject" } })
      .eq("id", rc.id);
    return;
  }

  await admin
    .from("dialog_sessions")
    .update({
      project_id: chosenProjectId,
      metadata: {
        ...sessionMeta,
        assignment: {
          ...(sessionMeta.assignment ?? {}),
          assigned_project_id: chosenProjectId,
          decided_at: new Date().toISOString(),
        },
      },
    })
    .eq("id", rc.session_id);

  if (ctx.asset_id) {
    await admin.from("assets").update({ project_id: chosenProjectId }).eq("id", ctx.asset_id);
  }

  const sessionMetaRunId = sessionMeta?.extraction_run_id;
  if (sessionMetaRunId) {
    await admin
      .from("proposed_facts")
      .update({ project_id: chosenProjectId })
      .eq("user_id", user_id)
      .eq("extraction_run_id", sessionMetaRunId);
  }

  await admin
    .from("review_cases")
    .update({
      box_state: "confirmed",
      user_decision: { ...user_decision, project_id: chosenProjectId },
    })
    .eq("id", rc.id);
}
