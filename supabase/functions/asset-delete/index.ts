// Hard-delete an asset, its storage object and all derived rows.
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

  let asset_id = "";
  try {
    const body = await req.json();
    asset_id = String(body?.asset_id ?? "");
  } catch { /* */ }
  if (!asset_id) return json({ error: "asset_id" }, 400);

  const admin = createClient(url, service);

  const { data: asset } = await admin
    .from("assets")
    .select("id, user_id, storage_path")
    .eq("id", asset_id)
    .maybeSingle();
  if (!asset || asset.user_id !== userId) return json({ error: "forbidden" }, 403);

  // Cascade derived
  await admin.from("parsed_documents").delete().eq("asset_id", asset_id);
  await admin.from("sources").delete().eq("asset_id", asset_id);
  await admin.from("aol_runs").delete().eq("asset_id", asset_id);
  await admin.from("proposed_facts").delete().eq("user_id", userId).is("source_id", null).eq("parsed_document_id", null); // noop guard

  const { error: dErr } = await admin.from("assets").delete().eq("id", asset_id);
  if (dErr) return json({ error: dErr.message }, 500);

  if (asset.storage_path) {
    try {
      await admin.storage.from("intake-files").remove([asset.storage_path]);
    } catch { /* ignore */ }
  }

  return json({ ok: true });
});
