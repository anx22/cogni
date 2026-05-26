// Hard-delete a project and all its child rows.
// Auth-gated by Supabase JWT, then service-role cascade.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { withLogging } from "../_shared/withLogging.ts";
import { ok, fail } from "../_shared/http.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";

Deno.serve(
  withLogging("project-delete", async (req, log) => {
    if (req.method !== "POST") return fail("method", 405);

    const auth = await getAuthenticatedUser(req);
    if (!auth.ok) return fail(auth.error, auth.status);
    const userId = auth.userId;
    log.bind({ userId });

    let project_id = "";
    try {
      const body = await req.json();
      project_id = String(body?.project_id ?? "");
    } catch {
      /* */
    }
    if (!project_id) return fail("project_id", 400);

    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, service);
    log.stage("enter", "deleting project", { project_id });

    const { data: project } = await admin
      .from("projects")
      .select("id, user_id")
      .eq("id", project_id)
      .maybeSingle();
    if (!project || project.user_id !== userId) {
      log.warn("forbidden", "project not owned", { project_id });
      return fail("forbidden", 403);
    }

    const { data: assets } = await admin
      .from("assets")
      .select("id, storage_path")
      .eq("project_id", project_id);
    const paths = (assets ?? []).map((a) => a.storage_path).filter(Boolean) as string[];
    const assetIds = (assets ?? []).map((a) => a.id);
    if (assetIds.length > 0) {
      await admin.from("parsed_documents").delete().in("asset_id", assetIds);
      await admin.from("sources").delete().in("asset_id", assetIds);
    }

    const childTables = [
      "proposed_facts",
      "canonical_facts",
      "change_events",
      "contradictions",
      "deadlines",
      "decisions",
      "tasks",
      "open_points",
      "topics",
      "gap_signals",
      "dependencies",
      "outcome_signals",
      "dialog_sessions",
      "project_state_snapshots",
      "project_stakeholder_links",
      "feedback",
      "aol_runs",
      "assets",
    ];
    for (const t of childTables) {
      await admin.from(t).delete().eq("project_id", project_id);
    }

    const { error: pErr } = await admin.from("projects").delete().eq("id", project_id);
    if (pErr) {
      log.error("delete", "projects.delete failed", pErr);
      return fail(pErr.message, 500);
    }

    if (paths.length > 0) {
      try {
        await admin.storage.from("intake-files").remove(paths);
      } catch (err) {
        log.warn("storage", "remove failed (ignored)", { err: String(err) });
      }
    }

    log.stage("exit", "project deleted", { deleted_assets: assetIds.length });
    return ok({ ok: true, deleted_assets: assetIds.length });
  }),
);
