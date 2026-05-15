// =============================================================================
//  commit-fact / mirror — Graphiti-Spiegelung.
// -----------------------------------------------------------------------------
//  Schreibt das frisch committed canonical_fact als Episode in den Wissens-
//  graphen (group_id = project_id). Einzige Stelle in der App, die Graphiti
//  aktiv beschreibt — Vertrag „Supabase = Master, Graphiti = Spiegel".
//  Best-Effort: Fehler werden in canonical_facts.provenance.graphiti_error
//  festgehalten, nie geworfen.
// =============================================================================
// deno-lint-ignore-file no-explicit-any

import {
  addMessage as graphitiAddMessage,
  isGraphitiConfigured,
  GraphitiUnavailableError,
  GraphitiHttpError,
} from "../_shared/graphiti.ts";
import type { Logger } from "../_shared/logger.ts";

export async function mirrorToGraphiti(
  admin: any,
  args: {
    canonical_fact_id: string;
    project_id: string;
    fact_type: string;
    content: Record<string, unknown>;
  },
  log?: Logger,
): Promise<void> {
  if (!isGraphitiConfigured()) {
    log?.warn("graphiti.mirror", "GRAPHITI_SERVICE_URL not set — skipped");
    return;
  }
  log?.stage("graphiti.mirror.start", "preparing episode", { canonical_fact_id: args.canonical_fact_id });

  const { data: ownerRow } = await admin
    .from("canonical_facts")
    .select("user_id")
    .eq("id", args.canonical_fact_id)
    .single();
  const ownerId = ownerRow?.user_id ?? null;

  const c = args.content ?? {};
  const title = (c as any).title?.toString().trim() || args.fact_type;
  const rest = Object.entries(c)
    .filter(([k, v]) => k !== "title" && v != null && v !== "")
    .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join(" · ");
  const episodeContent = rest ? `${title} — ${rest}` : title;

  try {
    await graphitiAddMessage({
      project_id: args.project_id,
      content: episodeContent,
      role_type: "user",
      name: `${args.fact_type}:${args.canonical_fact_id.slice(0, 8)}`,
      source_description: `canonical_fact:${args.canonical_fact_id}`,
    });
    log?.stage("graphiti.message", "mirror sent", { source_description: `canonical_fact:${args.canonical_fact_id}` });

    // status='ok' = Mirror-Send erfolgreich (HTTP 2xx). Episode-UUID wird
    // separat per `graphiti-reconcile` aufgelöst (eigene Log-Zeile).
    // Früher hier 'queued' — irreführend, da nichts mehr zu tun ist; siehe DECISIONS 2026-05-15.
    await admin.from("graphiti_sync_log").insert({
      user_id: ownerId,
      entity_id: args.canonical_fact_id,
      entity_type: args.fact_type ?? "canonical_fact",
      operation: "mirror",
      status: "ok",
      payload: { source_description: `canonical_fact:${args.canonical_fact_id}`, project_id: args.project_id },
    });

    const { data: cur } = await admin
      .from("canonical_facts")
      .select("provenance")
      .eq("id", args.canonical_fact_id)
      .single();
    const prov = (cur?.provenance ?? {}) as Record<string, unknown>;
    const { error: uErr } = await admin
      .from("canonical_facts")
      .update({
        provenance: {
          ...prov,
          graphiti: {
            queued: true,
            queued_at: new Date().toISOString(),
            mode: "async_no_episode_uuid",
            source_description: `canonical_fact:${args.canonical_fact_id}`,
          },
        },
      })
      .eq("id", args.canonical_fact_id);
    if (uErr) {
      log?.warn("graphiti.provenance_update_failed", "provenance update after mirror failed", { error: uErr.message });
    }
  } catch (err) {
    const errInfo =
      err instanceof GraphitiUnavailableError ? { kind: "unavailable", message: err.message }
      : err instanceof GraphitiHttpError ? { kind: "http", status: err.status, body: err.body.slice(0, 240) }
      : { kind: "unknown", message: err instanceof Error ? err.message : String(err) };
    log?.error("graphiti.mirror", "mirror failed", err, errInfo);

    const { data: cur } = await admin
      .from("canonical_facts")
      .select("provenance")
      .eq("id", args.canonical_fact_id)
      .single();
    const prov = (cur?.provenance ?? {}) as Record<string, unknown>;
    await admin
      .from("canonical_facts")
      .update({
        provenance: {
          ...prov,
          graphiti_error: { ...errInfo, at: new Date().toISOString() },
        },
      })
      .eq("id", args.canonical_fact_id);

    await admin.from("graphiti_sync_log").insert({
      user_id: ownerId,
      entity_id: args.canonical_fact_id,
      entity_type: args.fact_type ?? "canonical_fact",
      operation: "mirror",
      status: "failed",
      error: typeof (errInfo as any).body === "string" ? (errInfo as any).body : (errInfo as any).message,
      payload: errInfo,
    });
  }
}
