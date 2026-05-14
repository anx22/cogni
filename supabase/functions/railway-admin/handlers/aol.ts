// =============================================================================
//  handlers/aol.ts — Direkter /aol/run-Aufruf
// -----------------------------------------------------------------------------
//  test-aol  — Verhalten 1:1 aus dem alten Monolithen.
// =============================================================================

import { type Handler, jsonResponse } from "../_helpers.ts";

export const handlers: Record<string, Handler> = {
  "test-aol": async (body) => {
    const token = Deno.env.get("AOL_SERVICE_TOKEN");
    const baseRaw = (Deno.env.get("AOL_SERVICE_URL") ?? "").replace(/\/+$/, "");
    const url = baseRaw && !/^https?:\/\//i.test(baseRaw) ? `https://${baseRaw}` : baseRaw;
    if (!token || !url) throw new Error("AOL_SERVICE_TOKEN/URL missing");

    const { project_id, asset_id, user_id, trigger_type } = body;
    const r = await fetch(`${url}/aol/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        project_id,
        asset_id,
        user_id,
        trigger_type: trigger_type ?? "reuse_check_test",
      }),
    });
    const text = await r.text();
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      /* keep raw */
    }
    return jsonResponse({ status: r.status, body: parsed });
  },
};
