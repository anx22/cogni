// =============================================================================
//  commit-fact / snapshot — Session-Progress + Project-State-Snapshots.
// =============================================================================
// deno-lint-ignore-file no-explicit-any

import type { Logger } from "../_shared/logger.ts";

export async function updateSessionProgress(admin: any, session_id: string) {
  const { data: caseStats } = await admin
    .from("review_cases")
    .select("box_state")
    .eq("session_id", session_id);
  const total = caseStats?.length ?? 0;
  const resolved =
    caseStats?.filter((c: any) => ["confirmed", "rejected", "escalated"].includes(c.box_state))
      .length ?? 0;
  await admin
    .from("dialog_sessions")
    .update({
      resolved_boxes: resolved,
      total_boxes: total,
      status: total > 0 && resolved >= total ? "completed" : "in_progress",
    })
    .eq("id", session_id);
}

// Schreibt einen kompakten Snapshot des Projektzustands. Counts pro Tabelle +
// Trigger-Event. Reicht, um den Verlauf-Feed mit echtem zeitlichem Anker zu füllen.
export async function writeProjectSnapshot(
  admin: any,
  user_id: string,
  project_id: string,
  opts: { trigger_event: string; canonical_fact_id?: string; log?: Logger },
) {
  try {
    const tables = [
      "canonical_facts",
      "decisions",
      "tasks",
      "deadlines",
      "open_points",
      "gap_signals",
      "dependencies",
      "contradictions",
    ];
    const counts: Record<string, number> = {};
    await Promise.all(
      tables.map(async (t) => {
        const { count } = await admin
          .from(t)
          .select("id", { count: "exact", head: true })
          .eq("project_id", project_id);
        counts[t] = count ?? 0;
      }),
    );
    await admin.from("project_state_snapshots").insert({
      user_id,
      project_id,
      trigger_event: opts.trigger_event,
      summary: humanizeTriggerEvent(opts.trigger_event, counts),
      snapshot: {
        counts,
        last_canonical_fact_id: opts.canonical_fact_id ?? null,
        captured_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    opts.log?.warn("snapshot.failed", "writeProjectSnapshot failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// Übersetzt interne Trigger-Events (z. B. "commit:stakeholder:add") in einen
// kurzen, menschlich lesbaren Satz.
export function humanizeTriggerEvent(event: string, counts: Record<string, number>): string {
  const parts = event.split(":");
  const action = parts[0] ?? "update";
  const subject = parts[1] ?? "fakt";
  const verb = parts[2] ?? "";

  const subjectMap: Record<string, string> = {
    stakeholder: "Stakeholder",
    deadline: "Termin",
    decision: "Entscheidung",
    task: "Aufgabe",
    open_point: "offener Punkt",
    gap_signal: "Lücke",
    contradiction: "Widerspruch",
    dependency: "Abhängigkeit",
    fact: "Fakt",
  };
  const verbMap: Record<string, string> = {
    add: "ergänzt",
    update: "aktualisiert",
    remove: "entfernt",
    resolve: "geschlossen",
    confirm: "bestätigt",
    reject: "verworfen",
  };
  const actionMap: Record<string, string> = {
    commit: "übernommen",
    revise: "angepasst",
  };

  const subj = subjectMap[subject] ?? subject;
  const v = verbMap[verb] ?? actionMap[action] ?? "aktualisiert";
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return `${subj} ${v} — Projekt enthält jetzt ${total} bestätigte Erkenntnisse.`;
}
