// =============================================================================
//  intake-trigger
// -----------------------------------------------------------------------------
//  Neue Eintrittstür der Verstehens-Pipeline (ersetzt direkten Aufruf von
//  intake-understand).
//
//  Verhalten:
//    1. Erzeugt einen aol_runs-Eintrag (status=pending) für UI-Tracing
//    2. Wenn AOL_SERVICE_URL konfiguriert ist → POST {AOL_URL}/aol/run
//       mit Bearer AOL_SERVICE_TOKEN, der LangGraph-Service übernimmt
//    3. Solange AOL noch nicht deployt ist → ruft intake-understand
//       als Fallback auf, damit die App nicht stehen bleibt
//
//  Body: { asset_id: string, retry?: boolean }
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  asset_id: string;
  retry?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const aolUrl = (Deno.env.get("AOL_SERVICE_URL") ?? "").replace(/\/+$/, "");
  const aolToken = Deno.env.get("AOL_SERVICE_TOKEN") ?? "";

  let asset_id = "";
  let runId: string | null = null;

  try {
    const body = (await req.json()) as Payload;
    asset_id = body.asset_id;
    if (!asset_id) throw new Error("asset_id fehlt");

    const { data: asset, error: aErr } = await admin
      .from("assets")
      .select("id, user_id, project_id")
      .eq("id", asset_id)
      .single();
    if (aErr || !asset) throw new Error(`Asset nicht gefunden: ${aErr?.message}`);

    // 1. aol_runs anlegen ----------------------------------------------------
    const { data: run } = await admin
      .from("aol_runs")
      .insert({
        user_id: asset.user_id,
        asset_id,
        project_id: asset.project_id ?? null,
        status: "pending",
        trigger_type: body.retry ? "retry" : "intake",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    runId = run?.id ?? null;

    // 2. Wenn AOL konfiguriert ist → dorthin abgeben -------------------------
    if (aolUrl && aolToken) {
      try {
        const res = await fetch(`${aolUrl}/aol/run`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${aolToken}`,
          },
          body: JSON.stringify({
            asset_id,
            user_id: asset.user_id,
            project_id: asset.project_id,
            run_id: runId,
            retry: !!body.retry,
          }),
        });
        const txt = await res.text();
        if (!res.ok) {
          throw new Error(`AOL ${res.status}: ${txt.slice(0, 300)}`);
        }
        await admin
          .from("aol_runs")
          .update({ status: "running", current_node: "router" })
          .eq("id", runId);
        return ok({ run_id: runId, mode: "aol", aol_response: safeJson(txt) });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("intake-trigger: AOL call failed, falling back:", msg);
        await admin
          .from("aol_runs")
          .update({
            status: "failed",
            error: { message: msg, where: "aol_call" },
            ended_at: new Date().toISOString(),
          })
          .eq("id", runId);
        // Fallthrough auf Legacy-Pfad
      }
    }

    // 3. Fallback: bestehenden intake-understand triggern --------------------
    //    Solange der AOL-Service noch nicht steht, läuft die alte Pipeline.
    const { error: invErr } = await admin.functions.invoke("intake-understand", {
      body: { asset_id, retry: !!body.retry },
    });
    if (invErr) throw new Error(`intake-understand: ${invErr.message}`);

    if (runId) {
      await admin
        .from("aol_runs")
        .update({
          status: "completed",
          current_node: "legacy_fallback",
          ended_at: new Date().toISOString(),
        })
        .eq("id", runId);
    }
    return ok({ run_id: runId, mode: "legacy" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("intake-trigger error:", msg);
    if (runId) {
      await admin
        .from("aol_runs")
        .update({
          status: "failed",
          error: { message: msg },
          ended_at: new Date().toISOString(),
        })
        .eq("id", runId);
    }
    return fail(msg, 500);
  }
});

function safeJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return s; }
}

function ok(payload: unknown) {
  return new Response(JSON.stringify({ ok: true, ...(payload as object) }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function fail(msg: string, status = 500) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
