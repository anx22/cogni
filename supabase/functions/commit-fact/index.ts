// =============================================================================
//  commit-fact
// -----------------------------------------------------------------------------
//  Schritt 4: ein review_case wird vom Nutzer entschieden.
//
//  Spezialbehandlung Phase 7.5:
//  - box_type='assignment' → schreibt Projektwahl in dialog_sessions.metadata,
//    legt ggf. neues Projekt an, propagiert die project_id auf alle
//    proposed_facts dieser Session.
//  - fact_type='open_point' → zusätzlich gap_signals
//  - fact_type='reference'  → zusätzlich dependencies
//
//  Liest Projektzuordnung aus Session-Metadaten — kein Lazy "Allgemein" mehr.
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  addMessage as graphitiAddMessage,
  isGraphitiConfigured,
  GraphitiUnavailableError,
  GraphitiHttpError,
} from "../_shared/graphiti.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  review_case_id: string;
  decision: "confirm" | "reject";
  user_decision?: Record<string, unknown> | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData } = await userClient.auth.getUser();
  const user = userData?.user;
  if (!user) return fail("nicht angemeldet", 401);

  try {
    const { review_case_id, decision, user_decision } = (await req.json()) as Payload;
    if (!review_case_id || !decision) throw new Error("review_case_id + decision erforderlich");

    const { data: rc, error: rcErr } = await admin
      .from("review_cases")
      .select("*, proposed_fact:proposed_facts(*), session:dialog_sessions(*)")
      .eq("id", review_case_id)
      .single();
    if (rcErr || !rc) throw new Error(`review_case nicht gefunden: ${rcErr?.message}`);
    if (rc.user_id !== user.id) return fail("kein Zugriff", 403);

    // ==== Sonderfall: Zuordnungsbox =====================================
    if (rc.box_type === "assignment") {
      if (decision === "reject") {
        return new Response(
          JSON.stringify({
            ok: false,
            code: "ASSIGNMENT_REQUIRED",
            error: "Projektzuordnung ist erforderlich und kann nicht verworfen werden.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      await handleAssignment(admin, user.id, rc, decision, user_decision);
      await updateSessionProgress(admin, rc.session_id);
      return ok({});
    }

    // ==== Guard: andere Boxen brauchen erst die Zuordnung ===============
    {
      const sessionMeta = (rc.session?.metadata ?? {}) as Record<string, any>;
      const hasAssignment =
        !!sessionMeta?.assignment?.assigned_project_id || !!rc.session?.project_id;
      if (!hasAssignment) {
        // Prüfen ob es überhaupt eine Assignment-Box in der Session gibt
        const { data: assignmentCase } = await admin
          .from("review_cases")
          .select("box_state")
          .eq("session_id", rc.session_id)
          .eq("box_type", "assignment")
          .maybeSingle();
        if (assignmentCase && assignmentCase.box_state !== "confirmed") {
          return new Response(
            JSON.stringify({
              ok: false,
              code: "NEEDS_ASSIGNMENT",
              error: "Bitte zuerst die Projektzuordnung entscheiden.",
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }
    }

    const pf = rc.proposed_fact as
      | {
          id: string;
          fact_type: string;
          content: Record<string, unknown>;
          delta_type: string | null;
          against_fact_id: string | null;
          source_id: string | null;
          parsed_document_id: string | null;
          confidence: number | null;
          extraction_run_id: string | null;
          project_id: string | null;
        }
      | null;

    if (decision === "confirm") {
      if (!pf) throw new Error("proposed_fact fehlt — kann nicht festschreiben");

      // Projekt-ID aus Session bevorzugen, sonst proposed_fact, sonst Fehler
      const sessionMeta = (rc.session?.metadata ?? {}) as Record<string, any>;
      const sessionProjectId =
        sessionMeta?.assignment?.assigned_project_id ?? rc.session?.project_id ?? null;
      const project_id = sessionProjectId ?? pf.project_id;

      if (!project_id) {
        // Kein 500 — sonst Blank-Screen im Frontend. Strukturierte Antwort mit Code.
        return new Response(
          JSON.stringify({
            ok: false,
            code: "NEEDS_ASSIGNMENT",
            error: "Bitte zuerst die Projektzuordnung entscheiden.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Korrektur-Erkennung: enthält user_decision einen abweichenden content,
      // committen wir den korrigierten Wert und protokollieren in `corrections`.
      const ud = (user_decision ?? {}) as Record<string, unknown>;
      const correctedContent =
        ud && typeof ud.content === "object" && ud.content !== null
          ? (ud.content as Record<string, unknown>)
          : null;
      const wasCorrected =
        !!correctedContent &&
        JSON.stringify(correctedContent) !== JSON.stringify(pf.content);
      const finalContent = correctedContent ?? pf.content;
      const correctionReason =
        typeof ud.reason === "string" ? ud.reason : null;

      const { data: cf, error: cfErr } = await admin
        .from("canonical_facts")
        .insert({
          user_id: user.id,
          project_id,
          fact_type: pf.fact_type as never,
          content: finalContent,
          source_proposed_fact_id: pf.id,
          provenance: {
            source_id: pf.source_id,
            parsed_document_id: pf.parsed_document_id,
            extraction_run_id: pf.extraction_run_id,
            confidence: pf.confidence,
            committed_at: new Date().toISOString(),
            corrected: wasCorrected,
          },
        })
        .select("id")
        .single();
      if (cfErr) throw new Error(`canonical_facts: ${cfErr.message}`);

      // Graphiti-Spiegelung: Supabase bleibt Master, Graphiti bekommt das
      // Faktum als Episode (group_id=project_id). Async, daher generieren wir
      // die UUID selbst und schreiben sie direkt in canonical_facts.graphiti_uuid.
      // Fehler dürfen den Commit NIEMALS killen — Graphiti ist Spiegel, nicht Wahrheit.
      await mirrorToGraphiti(admin, {
        canonical_fact_id: cf!.id,
        project_id,
        fact_type: pf.fact_type,
        content: finalContent,
      });

      if (wasCorrected) {
        await admin.from("corrections").insert({
          user_id: user.id,
          canonical_fact_id: cf!.id,
          previous_value: pf.content,
          corrected_value: finalContent,
          reason: correctionReason,
        });
      }

      // Spezial-Schreibpfade: Gap & Dependency
      if (pf.fact_type === "open_point") {
        const c = (finalContent ?? {}) as any;
        await admin.from("gap_signals").insert({
          user_id: user.id,
          project_id,
          canonical_fact_id: cf!.id,
          title: c.title ?? "Offener Punkt",
          impact: typeof c.impact === "string" ? c.impact : null,
          affects: typeof c.affects === "string" ? c.affects : null,
          status: "open",
        });
      }
      if (pf.fact_type === "reference") {
        const c = (finalContent ?? {}) as any;
        await admin.from("dependencies").insert({
          user_id: user.id,
          project_id,
          source_id: cf!.id,
          source_type: "canonical_fact",
          target_id: cf!.id, // V1: Self-Ref bis echtes Linking kommt (Phase 8)
          target_type: typeof c.target_type === "string" ? c.target_type : "external",
          dependency_type: "haengt_ab_von",
          description: typeof c.description === "string" ? c.description : null,
        });
      }

      const eventType = wasCorrected
        ? "replace"
        : ((pf.delta_type ?? "add") as
            | "confirm" | "add" | "replace" | "contradict" | "merge" | "discard");
      await admin.from("change_events").insert({
        user_id: user.id,
        project_id,
        canonical_fact_id: cf!.id,
        review_case_id,
        event_type: eventType,
        new_value: finalContent,
        previous_value: wasCorrected ? pf.content : null,
      });

      await admin.from("proposed_facts").update({ status: "committed" }).eq("id", pf.id);
      await admin
        .from("review_cases")
        .update({ box_state: "confirmed", user_decision: user_decision ?? { decision: "confirm" } })
        .eq("id", review_case_id);

      // Projekt-Snapshot schreiben — gibt dem Verlauf einen zeitlichen Anker.
      await writeProjectSnapshot(admin, user.id, project_id, {
        trigger_event: `commit:${pf.fact_type}:${eventType}`,
        canonical_fact_id: cf!.id,
      });
    } else {
      if (pf) {
        await admin.from("proposed_facts").update({ status: "rejected" }).eq("id", pf.id);
      }
      await admin
        .from("review_cases")
        .update({ box_state: "rejected", user_decision: user_decision ?? { decision: "reject" } })
        .eq("id", review_case_id);
    }

    await updateSessionProgress(admin, rc.session_id);

    // Best-effort: AOL informieren, damit confirm_to_graph-Knoten den Wissens-
    // graphen aktualisiert (Episode/Invalidation). Fehler dürfen den User-Flow
    // niemals blockieren — wir loggen nur.
    notifyAol({
      review_case_id,
      decision,
      user_id: user.id,
    }).catch((e) => console.warn("aol-confirm notify failed:", e?.message ?? e));

    return ok({});
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("commit-fact error:", msg);
    return fail(msg, 500);
  }
});

// ----------------------------------------------------------------------------

async function handleAssignment(
  admin: any,
  user_id: string,
  rc: any,
  decision: "confirm" | "reject",
  user_decision?: Record<string, unknown> | null,
) {
  const ctx = (rc.context ?? {}) as any;
  const sessionMeta = (rc.session?.metadata ?? {}) as any;
  let chosenProjectId: string | null = null;

  if (decision === "confirm") {
    // user_decision kann enthalten: { project_id?: string, new_project_name?: string }
    const ud = (user_decision ?? {}) as { project_id?: string; new_project_name?: string };
    if (ud.project_id) {
      chosenProjectId = ud.project_id;
    } else if (ud.new_project_name) {
      const { data: np, error: npErr } = await admin
        .from("projects")
        .insert({ user_id, name: ud.new_project_name })
        .select("id")
        .single();
      if (npErr) throw new Error(`Neues Projekt: ${npErr.message}`);
      chosenProjectId = np.id;
    } else if (ctx.assignment_mode === "auto" && ctx.candidates?.[0]?.project_id) {
      // Default-Bestätigung der Auto-Zuordnung
      chosenProjectId = ctx.candidates[0].project_id;
    } else if (ctx.assignment_mode === "new" && ctx.suggested_new_name) {
      const { data: np, error: npErr } = await admin
        .from("projects")
        .insert({ user_id, name: ctx.suggested_new_name })
        .select("id")
        .single();
      if (npErr) throw new Error(`Neues Projekt: ${npErr.message}`);
      chosenProjectId = np.id;
    } else {
      throw new Error("Keine Projektwahl getroffen");
    }
  } else {
    // verwerfen → wir tun nichts an Zuordnung; User soll andere Box neu wählen
    await admin
      .from("review_cases")
      .update({ box_state: "rejected", user_decision: user_decision ?? { decision: "reject" } })
      .eq("id", rc.id);
    return;
  }

  // Session, Asset, alle proposed_facts dieser Session updaten
  await admin
    .from("dialog_sessions")
    .update({
      project_id: chosenProjectId,
      metadata: {
        ...sessionMeta,
        assignment: {
          ...(sessionMeta.assignment ?? {}),
          assigned_project_id: chosenProjectId,
          decided_at: new Date().toISOString(),
        },
      },
    })
    .eq("id", rc.session_id);

  if (ctx.asset_id) {
    await admin
      .from("assets")
      .update({ project_id: chosenProjectId })
      .eq("id", ctx.asset_id);
  }

  // alle pending proposed_facts dieser Session bekommen project_id
  const sessionMetaRunId = sessionMeta?.extraction_run_id;
  if (sessionMetaRunId) {
    await admin
      .from("proposed_facts")
      .update({ project_id: chosenProjectId })
      .eq("user_id", user_id)
      .eq("extraction_run_id", sessionMetaRunId);
  }

  await admin
    .from("review_cases")
    .update({
      box_state: "confirmed",
      user_decision: { ...user_decision, project_id: chosenProjectId },
    })
    .eq("id", rc.id);
}

async function updateSessionProgress(admin: any, session_id: string) {
  const { data: caseStats } = await admin
    .from("review_cases")
    .select("box_state")
    .eq("session_id", session_id);
  const total = caseStats?.length ?? 0;
  const resolved =
    caseStats?.filter((c: any) =>
      ["confirmed", "rejected", "escalated"].includes(c.box_state),
    ).length ?? 0;
  await admin
    .from("dialog_sessions")
    .update({
      resolved_boxes: resolved,
      total_boxes: total,
      status: total > 0 && resolved >= total ? "completed" : "in_progress",
    })
    .eq("id", session_id);
}

// Schreibt einen kompakten Snapshot des Projektzustands. Bewusst günstig
// gehalten: Counts pro Tabelle + Trigger-Event. Reicht, um den Verlauf-Feed
// im Projektscreen mit echtem zeitlichem Anker zu füllen.
async function writeProjectSnapshot(
  admin: any,
  user_id: string,
  project_id: string,
  opts: { trigger_event: string; canonical_fact_id?: string },
) {
  try {
    const tables = [
      "canonical_facts",
      "decisions",
      "tasks",
      "deadlines",
      "open_points",
      "gap_signals",
      "dependencies",
      "contradictions",
    ];
    const counts: Record<string, number> = {};
    await Promise.all(
      tables.map(async (t) => {
        const { count } = await admin
          .from(t)
          .select("id", { count: "exact", head: true })
          .eq("project_id", project_id);
        counts[t] = count ?? 0;
      }),
    );
    await admin.from("project_state_snapshots").insert({
      user_id,
      project_id,
      trigger_event: opts.trigger_event,
      summary: humanizeTriggerEvent(opts.trigger_event, counts),
      snapshot: {
        counts,
        last_canonical_fact_id: opts.canonical_fact_id ?? null,
        captured_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    // Snapshot-Fehler dürfen den Commit-Pfad nicht killen
    console.warn("writeProjectSnapshot failed:", err);
  }
}

// Übersetzt interne Trigger-Events (z. B. "commit:stakeholder:add") in einen
// kurzen, menschlich lesbaren Satz. Niemals Maschinen-Codes in die UI lassen.
function humanizeTriggerEvent(event: string, counts: Record<string, number>): string {
  const parts = event.split(":"); // ["commit","stakeholder","add"]
  const action = parts[0] ?? "update";
  const subject = parts[1] ?? "fakt";
  const verb = parts[2] ?? "";

  const subjectMap: Record<string, string> = {
    stakeholder: "Stakeholder",
    deadline: "Termin",
    decision: "Entscheidung",
    task: "Aufgabe",
    open_point: "offener Punkt",
    gap_signal: "Lücke",
    contradiction: "Widerspruch",
    dependency: "Abhängigkeit",
    fact: "Fakt",
  };
  const verbMap: Record<string, string> = {
    add: "ergänzt",
    update: "aktualisiert",
    remove: "entfernt",
    resolve: "geschlossen",
    confirm: "bestätigt",
    reject: "verworfen",
  };
  const actionMap: Record<string, string> = {
    commit: "übernommen",
    revise: "angepasst",
  };

  const subj = subjectMap[subject] ?? subject;
  const v = verbMap[verb] ?? actionMap[action] ?? "aktualisiert";
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return `${subj} ${v} — Projekt enthält jetzt ${total} bestätigte Erkenntnisse.`;
}

// ----------------------------------------------------------------------------
// AOL-Bridge: bei jeder bestätigten/abgelehnten Box informieren wir den
// LangGraph-Service, damit der confirm_to_graph-Knoten den Wissensgraphen
// nachzieht (Episode oder Invalidation). No-op solange AOL_SERVICE_URL fehlt.
// ----------------------------------------------------------------------------
async function notifyAol(payload: {
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

// ----------------------------------------------------------------------------
// Graphiti-Spiegelung
// ----------------------------------------------------------------------------
// Schreibt das frisch committed canonical_fact als Episode in den Wissens-
// graphen (group_id = project_id). Das ist die einzige Stelle in der App,
// die Graphiti aktiv beschreibt — damit bleibt der Vertrag „Supabase = Master,
// Graphiti = Spiegel" sauber. Best-Effort: Fehler werden in
// canonical_facts.provenance.graphiti_error festgehalten, nie geworfen.
async function mirrorToGraphiti(
  admin: any,
  args: {
    canonical_fact_id: string;
    project_id: string;
    fact_type: string;
    content: Record<string, unknown>;
  },
): Promise<void> {
  if (!isGraphitiConfigured()) {
    console.log("mirrorToGraphiti: GRAPHITI_SERVICE_URL nicht gesetzt — übersprungen.");
    return;
  }

  // user_id einmal vorab holen — wird sowohl für sync_log als auch im Catch gebraucht.
  const { data: ownerRow } = await admin
    .from("canonical_facts")
    .select("user_id")
    .eq("id", args.canonical_fact_id)
    .single();
  const ownerId = ownerRow?.user_id ?? null;

  // Episode-Body als lesbare Zeile bauen — Graphiti extrahiert daraus
  // Entitäten + Edges. Title voran, dann key:value Paare.
  const c = args.content ?? {};
  const title = (c as any).title?.toString().trim() || args.fact_type;
  const rest = Object.entries(c)
    .filter(([k, v]) => k !== "title" && v != null && v !== "")
    .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join(" · ");
  const episodeContent = rest ? `${title} — ${rest}` : title;

  try {
    // role/role_type/name werden vom Graphiti-Server in den Episode-Text
    // geprependet ("role(role_type): content"). Das macht den Sender selbst
    // zur Entity ("produktintelligenz(system) IS_AUFTRAGGEBER_OF Stefan").
    // → role weglassen, role_type='user'. Identifizierung läuft ausschließlich
    // über source_description (canonical_fact:<id>) und name (für UI/Probe).
    await graphitiAddMessage({
      project_id: args.project_id,
      content: episodeContent,
      role_type: "user",
      name: `${args.fact_type}:${args.canonical_fact_id.slice(0, 8)}`,
      source_description: `canonical_fact:${args.canonical_fact_id}`,
    });

    // Sync-Log: 'queued' direkt nach erfolgreichem POST. Die echte Episode-UUID
    // wird von graphiti-reconcile später nachgeliefert.
    await admin.from("graphiti_sync_log").insert({
      user_id: ownerId,
      entity_id: args.canonical_fact_id,
      entity_type: args.fact_type ?? "canonical_fact",
      operation: "mirror",
      status: "queued",
      payload: { source_description: `canonical_fact:${args.canonical_fact_id}`, project_id: args.project_id },
    });

    // Graphiti `/messages` ist asynchron und liefert KEINE Episode-UUID
    // zurück. Wir setzen `graphiti_uuid` daher NICHT mehr blind — sonst
    // referenziert es Phantome. Die Rückverknüpfung läuft über das
    // `source_description`-Feld (`canonical_fact:<id>`) und kann später
    // von einem Reconciler in `graphiti_uuid` aufgelöst werden.
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
      console.warn("mirrorToGraphiti: provenance-Update fehlgeschlagen:", uErr.message);
    }
  } catch (err) {
    const errInfo =
      err instanceof GraphitiUnavailableError ? { kind: "unavailable", message: err.message }
      : err instanceof GraphitiHttpError ? { kind: "http", status: err.status, body: err.body.slice(0, 240) }
      : { kind: "unknown", message: err instanceof Error ? err.message : String(err) };
    console.warn("mirrorToGraphiti fehlgeschlagen:", errInfo);

    // Fehler in provenance festhalten — Read-Modify-Write, weil Supabase
    // kein JSON-merge nativ unterstützt. Best-Effort: niemals werfen.
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

    // Sync-Log: Fehler ebenfalls protokollieren — Observability über Mirror-Health.
    await admin.from("graphiti_sync_log").insert({
      user_id: (cur as any)?.user_id ?? null,
      entity_id: args.canonical_fact_id,
      entity_type: args.fact_type ?? "canonical_fact",
      operation: "mirror",
      status: "failed",
      error: typeof (errInfo as any).body === "string" ? (errInfo as any).body : (errInfo as any).message,
      payload: errInfo,
    });
  }
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
