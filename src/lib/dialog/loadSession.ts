// =============================================================================
//  loadSession — lädt eine echte Dialog-Session aus der Datenbank.
//
//  Wichtig: Diese Schicht ist der EINZIGE Vertrag zwischen DB-Form
//  (review_cases.context) und UI-Form (DialogBox.payload).
//
//  - Pro box_type ein eigener Mapper.
//  - Für Assignment-Boxen wird IMMER die volle Projektliste nachgeladen, damit
//    die UI bestehende Projekte zeigen kann — auch dann, wenn der Backend-Lauf
//    keine candidates produziert hat (Auto-Repair für Altlasten).
// =============================================================================

import { supabase } from "@/integrations/supabase/client";
import type { DialogBox, DialogSession, BoxState } from "./types";
import { dbBoxTypeToUI } from "./boxMapping";
import { deriveSessionMode } from "./sessionMode";

const DB_TO_UI_STATE: Record<string, BoxState> = {
  proposed: "vorgeschlagen",
  expanded: "aufgeklappt",
  modified: "geaendert",
  confirmed: "bestaetigt",
  rejected: "verworfen",
  escalated: "eskaliert",
};

interface ProjectLite {
  project_id: string;
  name: string;
  score?: number;
  reasons?: string[];
}

/** Klartext aus einem strukturierten Fact-Content bauen — keine JSON-Strings ans UI. */
function buildFactSummary(factType: string | undefined, content: Record<string, unknown>): string {
  const c = content;
  switch (factType) {
    case "stakeholder": {
      const name = (c.name as string) ?? "";
      const role = (c.role as string) ?? "";
      const email = (c.email as string) ?? "";
      const org = (c.organization as string) ?? "";
      const parts = [name, role && `(${role})`, org, email].filter(Boolean);
      return parts.join(" · ");
    }
    case "decision":
      return (c.decision as string) ?? (c.title as string) ?? "Entscheidung";
    case "task":
      return (c.task as string) ?? (c.title as string) ?? "Aufgabe";
    case "deadline": {
      const what = (c.what as string) ?? (c.title as string) ?? "Termin";
      const when = (c.when as string) ?? (c.due_date as string) ?? "";
      return when ? `${what} — ${when}` : what;
    }
    case "topic":
      return (c.topic as string) ?? (c.title as string) ?? "Thema";
    case "open_point":
      return (c.title as string) ?? (c.question as string) ?? "Offener Punkt";
    case "reference":
      return (c.description as string) ?? (c.title as string) ?? "Referenz";
    default:
      return (c.title as string) ?? (c.summary as string) ?? "";
  }
}

/** Strukturierte Detail-Liste für die Wissensbox — Key-Value, ohne Roh-JSON. */
function buildFactDetails(
  factType: string | undefined,
  content: Record<string, unknown>,
): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = [];
  const skip = new Set(["title", "summary"]);
  const labelMap: Record<string, string> = {
    name: "Name",
    role: "Rolle",
    email: "E-Mail",
    organization: "Organisation",
    decision: "Entscheidung",
    rationale: "Begründung",
    task: "Aufgabe",
    assignee: "Verantwortlich",
    due_date: "Fällig",
    when: "Wann",
    what: "Was",
    topic: "Thema",
    description: "Beschreibung",
    impact: "Wirkung",
    affects: "Betrifft",
    valid_until: "Gültig bis",
    question: "Frage",
    target_type: "Zieltyp",
    url: "URL",
  };
  for (const [k, v] of Object.entries(content)) {
    if (skip.has(k) || v == null || v === "") continue;
    const label = labelMap[k] ?? k;
    const value = typeof v === "string" ? v : JSON.stringify(v);
    out.push({ label, value });
  }
  return out;
}

export async function loadDialogSession(sessionId: string): Promise<DialogSession | null> {
  const { data: session, error: sErr } = await supabase
    .from("dialog_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (sErr || !session) return null;

  const { data: cases, error: cErr } = await supabase
    .from("review_cases")
    .select("*")
    .eq("session_id", sessionId)
    .order("priority", { ascending: false });
  if (cErr) return null;

  // Wenn es eine Assignment-Box gibt: ALLE Projekte des Users nachladen.
  // Repariert auch Alt-Sessions, in denen candidates leer sind.
  const hasAssignment = (cases ?? []).some((c) => c.box_type === "assignment");
  let allProjects: ProjectLite[] = [];
  if (hasAssignment) {
    const { data: projs } = await supabase
      .from("projects")
      .select("id, name, status, updated_at")
      .eq("user_id", session.user_id)
      .order("updated_at", { ascending: false })
      .limit(50);
    allProjects = (projs ?? [])
      .filter((p) => p.status !== "archived")
      .map((p) => ({ project_id: p.id, name: p.name }));
  }

  const boxes: DialogBox[] = (cases ?? []).map((c) => {
    const ctx = (c.context ?? {}) as Record<string, unknown>;
    const factType = ctx.fact_type as string | undefined;
    const content = (ctx.content ?? {}) as Record<string, unknown>;
    const uiType = c.box_type === "assignment" ? "zuordnung" : dbBoxTypeToUI(c.box_type);
    const state = DB_TO_UI_STATE[c.box_state] ?? "vorgeschlagen";

    // Modalitäts-Vertrag (server geschrieben; bei Alt-Cases leer → defaults)
    const modality = (ctx.modality as string | undefined) ?? null;
    const attachesTo = (ctx.attaches_to as string | undefined) ?? null;
    const asks = (ctx.asks as string | undefined) ?? null;
    const understood = (ctx.understood as string | undefined) ?? null;
    const evidence = (ctx.evidence as string | undefined) ?? null;
    // Linker-Ergebnis (add|replace|contradict|merge|confirm), für DeltaTag in ReviewRow.
    const deltaType = (ctx.delta_type as string | undefined) ?? null;

    if (c.box_type === "assignment") {
      const rawCandidates = (ctx.candidates ?? []) as ProjectLite[];
      const recommended =
        (ctx.recommended_project_id as string | undefined) ??
        ((ctx.assignment_mode as string) === "auto" ? rawCandidates[0]?.project_id : undefined) ??
        null;
      const enrichedCandidates: ProjectLite[] = rawCandidates.map((c) => ({
        ...c,
        name:
          c.name || allProjects.find((p) => p.project_id === c.project_id)?.name || c.project_id,
      }));
      return {
        id: c.id,
        type: "zuordnung",
        state,
        title: c.title ?? "Projektzuordnung",
        payload: {
          assignment_mode: ctx.assignment_mode,
          candidates: enrichedCandidates,
          all_projects: allProjects,
          recommended_project_id: recommended,
          suggested_new_name: ctx.suggested_new_name ?? null,
          agent_reason: ctx.agent_reason ?? c.description ?? null,
          asset_id: ctx.asset_id,
          frage: c.title ?? "Welches Projekt passt?",
          __reviewCaseId: c.id,
        },
      };
    }

    const summary = (ctx.summary as string | undefined) ?? buildFactSummary(factType, content);
    const details = buildFactDetails(factType, content);

    // Stille-Substanz Sammelzeile (Backend setzt context.kind = "silent_substanz")
    if (ctx.kind === "silent_substanz") {
      return {
        id: c.id,
        type: "notiz",
        state,
        title: c.title ?? "Still übernommen",
        payload: {
          kind: "silent_substanz",
          count: ctx.count ?? 0,
          sachverhalt: c.description ?? null,
          __reviewCaseId: c.id,
        },
      };
    }

    if (c.box_type === "conflict") {
      return {
        id: c.id,
        type: "konflikt",
        state,
        title: c.title ?? "Widerspruch",
        payload: {
          beschreibung: (ctx.summary as string) ?? c.description ?? summary,
          faktA: (ctx.fact_a as string) ?? (content.fact_a as string) ?? "",
          faktB: (ctx.fact_b as string) ?? (content.fact_b as string) ?? "",
          against_fact_id: (ctx.against_fact_id as string) ?? null,
          modality,
          attaches_to: attachesTo,
          understood,
          evidence,
          delta_type: deltaType,
          quelle: factType ?? null,
          __reviewCaseId: c.id,
        },
      };
    }

    if (c.box_type === "gap_box") {
      return {
        id: c.id,
        type: "gap",
        state,
        title: c.title ?? "Lücke",
        payload: {
          wirkung:
            (ctx.wirkung as string) ??
            (typeof content.impact === "string" ? content.impact : undefined) ??
            summary,
          betrifft:
            (ctx.betrifft as string) ??
            (typeof content.affects === "string" ? content.affects : undefined),
          lebensdauer:
            (ctx.lebensdauer as string) ??
            (typeof content.valid_until === "string"
              ? `Gültig bis ${content.valid_until}`
              : undefined),
          asks,
          understood,
          evidence,
          delta_type: deltaType,
          quelle: factType ?? null,
          __reviewCaseId: c.id,
        },
      };
    }

    // Alle anderen Box-Typen (inkl. neue Modalitäts-Boxen) teilen sich diesen
    // Renderer; ReviewRow entscheidet anhand `type` + payload.asks, ob ein
    // Eingabefeld nötig ist.
    return {
      id: c.id,
      type: uiType,
      state,
      title: c.title ?? "(ohne Titel)",
      payload: {
        sachverhalt: summary,
        details,
        factType,
        content,
        // Modalitäts-Vertrag — der Renderer liest direkt davon.
        modality,
        attaches_to: attachesTo,
        asks,
        understood,
        evidence,
        delta_type: deltaType,
        quelle: factType ? factType : "",
        optionen: ctx.options,
        hinweis: ctx.hinweis,
        placeholder: ctx.placeholder,
        source_url: ctx.source_url,
        auszug: ctx.auszug,
        __reviewCaseId: c.id,
      },
    };
  });

  const mode = deriveSessionMode(session.status, boxes);

  let projectName: string | null = null;
  if (session.project_id) {
    const known = allProjects.find((p) => p.project_id === session.project_id);
    if (known) projectName = known.name;
    else {
      const { data: proj } = await supabase
        .from("projects")
        .select("name")
        .eq("id", session.project_id)
        .maybeSingle();
      projectName = proj?.name ?? null;
    }
  }

  return {
    id: session.id,
    anlass: session.summary ?? "Klärung",
    context: session.trigger_type,
    boxes,
    mode,
    closedAt: mode === "readonly" ? session.updated_at : null,
    projectId: session.project_id ?? null,
    projectName,
  };
}

export async function loadLatestOpenSession(
  userId: string,
  projectId?: string,
): Promise<DialogSession | null> {
  let q = supabase
    .from("dialog_sessions")
    .select("id")
    .eq("user_id", userId)
    .in("status", ["open", "in_progress"]);
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error || !data) return null;
  return loadDialogSession(data.id);
}

/** Schnelle Existenz-Prüfung für „Review öffnen"-Button im Header. */
export async function hasOpenSessionForProject(
  userId: string,
  projectId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("dialog_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .in("status", ["open", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}
