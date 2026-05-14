// Hard-delete an asset, its storage object and all derived rows.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { withErrorBoundary } from "../_shared/withErrorBoundary.ts";
import { createLogger } from "../_shared/logger.ts";
import { handleOptions, ok, fail } from "../_shared/http.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";

Deno.serve(withErrorBoundary("asset-delete", async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;
  if (req.method !== "POST") return fail("method", 405);

  const auth = await getAuthenticatedUser(req);
  if (!auth.ok) return fail(auth.error, auth.status);
  const userId = auth.userId;

  let asset_id = "";
  try {
    const body = await req.json();
    asset_id = String(body?.asset_id ?? "");
  } catch { /* */ }
  if (!asset_id) return fail("asset_id", 400);

  const url = Deno.env.get("SUPABASE_URL")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, service);
  const log = createLogger({ fn: "asset-delete", userId, client: admin });
  log.stage("enter", "deleting asset", { asset_id });

  const { data: asset } = await admin
    .from("assets")
    .select("id, user_id, storage_path")
    .eq("id", asset_id)
    .maybeSingle();
  if (!asset || asset.user_id !== userId) {
    log.warn("forbidden", "asset not owned", { asset_id });
    await log.flush();
    return fail("forbidden", 403);
  }

  // Find related parsed_documents and sources (by asset_id)
  const { data: pdocs } = await admin
    .from("parsed_documents").select("id").eq("asset_id", asset_id);
  const { data: srcs } = await admin
    .from("sources").select("id").eq("asset_id", asset_id);
  const pdocIds = (pdocs ?? []).map((r) => r.id);
  const srcIds = (srcs ?? []).map((r) => r.id);

  if (pdocIds.length > 0) {
    await admin.from("proposed_facts").delete().in("parsed_document_id", pdocIds);
  }
  if (srcIds.length > 0) {
    await admin.from("proposed_facts").delete().in("source_id", srcIds);
  }
  await admin.from("parsed_documents").delete().eq("asset_id", asset_id);
  await admin.from("sources").delete().eq("asset_id", asset_id);
  await admin.from("aol_runs").delete().eq("asset_id", asset_id);

  const { error: dErr } = await admin.from("assets").delete().eq("id", asset_id);
  if (dErr) {
    log.error("delete", "assets.delete failed", dErr);
    await log.flush();
    return fail(dErr.message, 500);
  }

  if (asset.storage_path) {
    try {
      await admin.storage.from("intake-files").remove([asset.storage_path]);
    } catch (err) {
      log.warn("storage", "remove failed (ignored)", { err: String(err) });
    }
  }

  log.stage("exit", "asset deleted", { pdocs: pdocIds.length, sources: srcIds.length });
  await log.flush();
  return ok({ ok: true });
}));
