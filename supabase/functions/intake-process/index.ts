import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  asset_id: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const unstructuredKey = Deno.env.get("UNSTRUCTURED_API_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  let asset_id = "";
  try {
    const body = (await req.json()) as Payload;
    asset_id = body.asset_id;
    if (!asset_id) throw new Error("asset_id fehlt");

    // Asset laden
    const { data: asset, error: aErr } = await admin
      .from("assets")
      .select("*")
      .eq("id", asset_id)
      .single();
    if (aErr || !asset) throw new Error(`Asset nicht gefunden: ${aErr?.message}`);

    // Status: processing
    await admin
      .from("assets")
      .update({ processing_status: "processing" })
      .eq("id", asset_id);

    // Datei aus Storage laden
    const { data: fileBlob, error: dErr } = await admin.storage
      .from("intake-files")
      .download(asset.storage_path);
    if (dErr || !fileBlob) throw new Error(`Download-Fehler: ${dErr?.message}`);

    // Unstructured API
    const form = new FormData();
    form.append("files", fileBlob, asset.file_name);
    form.append("strategy", "auto");

    const unstrRes = await fetch("https://api.unstructured.io/general/v0/general", {
      method: "POST",
      headers: { "unstructured-api-key": unstructuredKey, accept: "application/json" },
      body: form,
    });

    if (!unstrRes.ok) {
      const txt = await unstrRes.text();
      throw new Error(`Unstructured ${unstrRes.status}: ${txt.slice(0, 200)}`);
    }

    const segments = await unstrRes.json();

    // parsed_documents schreiben
    const { error: pErr } = await admin.from("parsed_documents").insert({
      asset_id,
      user_id: asset.user_id,
      segments,
      parser_version: "unstructured-v0-general",
    });
    if (pErr) throw new Error(`parsed_documents: ${pErr.message}`);

    // sources schreiben
    await admin.from("sources").insert({
      asset_id,
      user_id: asset.user_id,
      source_type: "upload",
      metadata: { file_name: asset.file_name },
    });

    // Status: completed
    await admin
      .from("assets")
      .update({ processing_status: "completed" })
      .eq("id", asset_id);

    return new Response(JSON.stringify({ ok: true, segments_count: Array.isArray(segments) ? segments.length : 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("intake-process error:", msg);
    if (asset_id) {
      await admin
        .from("assets")
        .update({ processing_status: "failed", metadata: { error: msg } })
        .eq("id", asset_id);
    }
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
