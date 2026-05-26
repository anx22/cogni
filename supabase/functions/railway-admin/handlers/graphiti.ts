// =============================================================================
//  handlers/graphiti.ts — Graphiti-Probe + Mirror-Test
// -----------------------------------------------------------------------------
//  graphiti-probe, test-mirror
//  Verhalten 1:1 aus dem alten Monolithen (inkl. URL-Normalisierung,
//  fehlendem uuid-Feld bei /messages — siehe DECISIONS.md).
// =============================================================================

import { type Handler, jsonResponse } from "../_helpers.ts";

function graphitiBase(): string {
  const raw = (Deno.env.get("GRAPHITI_SERVICE_URL") ?? "").replace(/\/+$/, "");
  if (!raw) return "";
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function graphitiHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = Deno.env.get("GRAPHITI_SERVICE_TOKEN") ?? "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export const handlers: Record<string, Handler> = {
  "graphiti-probe": async (body) => {
    const gBase = graphitiBase();
    const headers = graphitiHeaders();
    const { project_id, query } = body;
    const epRes = await fetch(`${gBase}/episodes/${encodeURIComponent(project_id)}?last_n=20`, {
      headers,
    });
    const epBody = await epRes.text();
    const sRes = await fetch(`${gBase}/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: query ?? "Teinacher",
        group_ids: [project_id],
        max_facts: 20,
      }),
    });
    const sBody = await sRes.text();
    return jsonResponse({
      episodes: { status: epRes.status, body: epBody.slice(0, 1500) },
      search: { status: sRes.status, body: sBody.slice(0, 1500) },
    });
  },

  "test-mirror": async (body) => {
    // Spiegel-Test: nimmt ein bestehendes canonical_fact, queued eine Episode
    // bei Graphiti (OHNE UUID — sonst NodeNotFoundError im Worker, validiert
    // 2026-05-13) und prüft, ob danach in Neo4j Episodic-Nodes erscheinen.
    // `graphiti_uuid` wird NICHT mehr gesetzt — Korrelation läuft über
    // `source_description`.
    const { canonical_fact_id, wait_ms } = body;
    if (!canonical_fact_id) throw new Error("canonical_fact_id required");
    const sbUrl = Deno.env.get("SUPABASE_URL")!;
    const sbKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const cfRes = await fetch(
      `${sbUrl}/rest/v1/canonical_facts?id=eq.${canonical_fact_id}&select=id,project_id,fact_type,content`,
      { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } },
    );
    const cfArr = await cfRes.json();
    if (!Array.isArray(cfArr) || !cfArr.length) throw new Error("canonical_fact not found");
    const cf = cfArr[0];

    const gBase = graphitiBase();
    const c = cf.content ?? {};
    const title = (c as any).title?.toString().trim() || cf.fact_type;
    const rest = Object.entries(c)
      .filter(([k, v]) => k !== "title" && v != null && v !== "")
      .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
      .join(" · ");
    const episodeContent = rest ? `${title} — ${rest}` : title;
    const sourceDesc = `canonical_fact:${cf.id}`;

    const epRes = await fetch(`${gBase}/messages`, {
      method: "POST",
      headers: graphitiHeaders(),
      body: JSON.stringify({
        group_id: cf.project_id,
        messages: [
          {
            content: episodeContent,
            role_type: "system",
            role: "produktintelligenz",
            name: `${cf.fact_type}:${cf.id.slice(0, 8)}`,
            source_description: sourceDesc,
            timestamp: new Date().toISOString(),
            // KEIN uuid-Feld — Server generiert selbst.
          },
        ],
      }),
    });
    const epStatus = epRes.status;
    const epBody = await epRes.text();

    const waitMs = typeof wait_ms === "number" ? Math.min(wait_ms, 60000) : 0;
    let episodesProbe: unknown = null;
    if (waitMs > 0) {
      await new Promise((r) => setTimeout(r, waitMs));
      const token = Deno.env.get("GRAPHITI_SERVICE_TOKEN") ?? "";
      const epListRes = await fetch(
        `${gBase}/episodes/${encodeURIComponent(cf.project_id)}?last_n=20`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      const epListBody = await epListRes.text();
      episodesProbe = { status: epListRes.status, body: epListBody.slice(0, 800) };
    }

    return jsonResponse({
      canonical_fact_id: cf.id,
      project_id: cf.project_id,
      episode_content: episodeContent.slice(0, 200),
      source_description: sourceDesc,
      graphiti_post: { status: epStatus, body: epBody.slice(0, 300) },
      episodes_after_wait: episodesProbe,
      note: "graphiti_uuid is NOT set anymore — server-generated, retrievable via source_description match.",
    });
  },
};
