// Hard-delete a project and all its child rows.
// Auth-gated by Supabase JWT, then service-role cascade.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "auth" }, 401);

  const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const { data: u } = await userClient.auth.getUser();
  const userId = u?.user?.id;
  if (!userId) return json({ error: "auth" }, 401);

  let project_id = "";
  try {
    const body = await req.json();
    project_id = String(body?.project_id ?? "");
  } catch { /* */ }
  if (!project_id) return json({ error: "project_id" }, 400);

  const admin = createClient(url, service);

  // Verify ownership
  const { data: project } = await admin
    .from("projects")
    .select("id, user_id")
    .eq("id", project_id)
    .maybeSingle();
  if (!project || project.user_id !== userId) return json({ error: "forbidden" }, 403);

  // Collect asset storage paths to remove from bucket
  const { data: assets } = await admin
    .from("assets")
    .select("id, storage_path")
    .eq("project_id", project_id);
  const paths = (assets ?? []).map((a) => a.storage_path).filter(Boolean) as string[];

  // Cascade: delete child tables that reference project_id (or via assets)
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

  // Delete project itself
  const { error: pErr } = await admin.from("projects").delete().eq("id", project_id);
  if (pErr) return json({ error: pErr.message }, 500);

  // Storage cleanup (best effort)
  if (paths.length > 0) {
    try {
      await admin.storage.from("intake-files").remove(paths);
    } catch { /* ignore */ }
  }

  return json({ ok: true, deleted_assets: assetIds.length });
});
