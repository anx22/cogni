// =============================================================================
//  commit-fact / notifications — AOL-Bridge.
// -----------------------------------------------------------------------------
//  Bei jeder bestätigten/abgelehnten Box informieren wir den LangGraph-Service,
//  damit der confirm_to_graph-Knoten den Wissensgraphen nachzieht.
//  No-op solange AOL_SERVICE_URL fehlt.
// =============================================================================

export async function notifyAol(payload: {
  review_case_id: string;
  decision: "confirm" | "reject";
  user_id: string;
}): Promise<void> {
  const url = (Deno.env.get("AOL_SERVICE_URL") ?? "").replace(/\/+$/, "");
  const token = Deno.env.get("AOL_SERVICE_TOKEN") ?? "";
  if (!url || !token) return;
  const res = await fetch(`${url}/aol/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AOL confirm ${res.status}: ${txt.slice(0, 200)}`);
  }
}
