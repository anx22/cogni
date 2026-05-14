import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatRelative } from "@/lib/format/relativeTime";
import type {
  ProjectViewModel,
  KonfliktVM,
  GapVM,
  DependencyVM,
  HandlungsbedarfVM,
  VerlaufVM,
  ThemaVM,
  DokumentVM,
  StakeholderVM,
  DeltaTyp,
} from "./types";

type Status = "loading" | "ready" | "empty" | "error";

const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" }) : "—";

const fmtShort = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("de-DE") : "";

const ageInDays = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));

// Übersetzt Snapshot-Summaries in lesbare Sprache. Alte Datensätze enthalten
// noch Maschinen-Codes wie "Snapshot nach commit:stakeholder:add" — die dürfen
// nie in der UI auftauchen.
const SUBJECT_DE: Record<string, string> = {
  stakeholder: "Stakeholder", deadline: "Termin", decision: "Entscheidung",
  task: "Aufgabe", open_point: "Offener Punkt", gap_signal: "Lücke",
  contradiction: "Widerspruch", dependency: "Abhängigkeit", fact: "Fakt",
};
const VERB_DE: Record<string, string> = {
  add: "ergänzt", update: "aktualisiert", remove: "entfernt",
  resolve: "geschlossen", confirm: "bestätigt", reject: "verworfen",
};
const humanizeSnapshotSummary = (raw: string | undefined): string | undefined => {
  if (!raw) return undefined;
  const m = raw.match(/^Snapshot nach\s+([a-z_]+):([a-z_]+)(?::([a-z_]+))?/i);
  if (!m) return raw;
  const subj = SUBJECT_DE[m[2]] ?? m[2];
  const verb = VERB_DE[m[3] ?? ""] ?? "aktualisiert";
  return `${subj} ${verb}.`;
};

const titleFromJson = (v: unknown, fallback = "—"): string => {
  if (!v || typeof v !== "object") return fallback;
  const o = v as Record<string, unknown>;
  for (const k of ["title", "name", "label", "summary"]) {
    if (typeof o[k] === "string" && o[k]) return o[k] as string;
  }
  return fallback;
};

const stringFromJson = (v: unknown, key: string): string | null => {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  return typeof o[key] === "string" ? (o[key] as string) : null;
};

const numberFromJson = (v: unknown, key: string): number | null => {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  return typeof o[key] === "number" ? (o[key] as number) : null;
};

interface UseProjectResult {
  status: Status;
  project: ProjectViewModel | null;
  error: string | null;
  /** True wenn das Projekt gelöscht wurde oder nicht (mehr) existiert. */
  vanished: boolean;
}

export function useProject(projectId: string | null | undefined): UseProjectResult {
  const { session } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [project, setProject] = useState<ProjectViewModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vanished, setVanished] = useState(false);
  const reloadKey = useRef(0);

  const userId = session?.user?.id;

  const load = useCallback(async () => {
    if (!projectId || !userId) return;
    setStatus("loading");
    setError(null);

    try {
      const [
        projectRes,
        snapshotRes,
        outcomeRes,
        deadlinesRes,
        canonicalRes,
        contradictionsRes,
        gapsRes,
        depsRes,
        decisionsRes,
        tasksRes,
        openPointsRes,
        feedbackRes,
        eventsRes,
        topicsRes,
        assetsRes,
        stakeholderRes,
      ] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
        supabase
          .from("project_state_snapshots")
          .select("summary, created_at, snapshot")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("outcome_signals")
          .select("*")
          .eq("project_id", projectId)
          .order("updated_at", { ascending: false })
          .limit(1),
        supabase
          .from("deadlines")
          .select("*")
          .eq("project_id", projectId)
          .order("due_date", { ascending: true }),
        supabase.from("canonical_facts").select("*").eq("project_id", projectId),
        supabase
          .from("contradictions")
          .select("*")
          .eq("project_id", projectId)
          .eq("resolved", false),
        supabase.from("gap_signals").select("*").eq("project_id", projectId).eq("status", "open"),
        supabase.from("dependencies").select("*").eq("project_id", projectId).eq("resolved", false),
        supabase.from("decisions").select("*").eq("project_id", projectId),
        supabase.from("tasks").select("*").eq("project_id", projectId),
        supabase.from("open_points").select("*").eq("project_id", projectId).eq("status", "open"),
        supabase.from("feedback").select("*").eq("project_id", projectId),
        supabase
          .from("change_events")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase.from("topics").select("*").eq("project_id", projectId),
        supabase
          .from("assets")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false }),
        supabase
          .from("project_stakeholder_links")
          .select("id, role, person_id, organization_id, persons(name, role), organizations(name)")
          .eq("project_id", projectId),
      ]);

      if (projectRes.error || !projectRes.data) {
        setVanished(true);
        setStatus("error");
        setError(projectRes.error?.message ?? "Projekt nicht gefunden");
        setProject(null);
        return;
      }
      if (projectRes.data.status === "archived") {
        setVanished(true);
        setStatus("error");
        setError("Projekt ist archiviert");
        setProject(null);
        return;
      }
      setVanished(false);

      const p = projectRes.data;
      const deadlines = deadlinesRes.data ?? [];
      const canonical = canonicalRes.data ?? [];
      const contradictions = contradictionsRes.data ?? [];
      const gaps = gapsRes.data ?? [];
      const deps = depsRes.data ?? [];
      const decisions = decisionsRes.data ?? [];
      const tasks = tasksRes.data ?? [];
      const openPoints = openPointsRes.data ?? [];
      const feedbackRows = feedbackRes.data ?? [];
      const events = eventsRes.data ?? [];
      const topics = topicsRes.data ?? [];
      const assets = assetsRes.data ?? [];
      const stakeholders = stakeholderRes.data ?? [];

      // Konflikte
      const factById = new Map(canonical.map((f) => [f.id, f]));
      const konflikte: KonfliktVM[] = contradictions.map((c) => {
        const a = c.fact_a_id ? factById.get(c.fact_a_id) : null;
        const b = c.fact_b_id ? factById.get(c.fact_b_id) : null;
        return {
          id: c.id,
          typ: c.contradiction_type,
          title: c.description ?? "Widerspruch",
          beschreibung: c.description ?? "",
          faktA: a ? titleFromJson(a.content, "Fakt A") : "Fakt A",
          faktB: b ? titleFromJson(b.content, "Fakt B") : "Fakt B",
          status: c.resolved ? "geloest" : "offen",
        };
      });

      // Gaps
      const gapVMs: GapVM[] = gaps.map((g) => ({
        id: g.id,
        titel: g.title,
        wirkung: g.impact ?? "—",
        betrifft: g.affects ?? "—",
        lebensdauer: `seit ${ageInDays(g.detected_at)} Tagen offen`,
      }));

      // Dependencies
      const depVMs: DependencyVM[] = deps.map((d) => ({
        id: d.id,
        typ: d.dependency_type,
        quelle: d.source_type,
        ziel: d.target_type,
        beschreibung: d.description ?? "",
      }));

      // Handlungsbedarf — abgeleitet
      const handlungsbedarf: HandlungsbedarfVM[] = [];
      decisions
        .filter((d) => d.status === "draft")
        .forEach((d) =>
          handlungsbedarf.push({
            id: `dec-${d.id}`,
            arbeitsmodus: "entscheiden",
            objektTyp: "entscheidung",
            titel: d.title,
            beschreibung: d.description ?? "",
            verantwortlich: null,
            frist: fmtShort(d.valid_until) || null,
            quelle: "Entscheidung",
            blocker: false,
          }),
        );
      contradictions.forEach((c) =>
        handlungsbedarf.push({
          id: `con-${c.id}`,
          arbeitsmodus: "entscheiden",
          objektTyp: "konflikt",
          titel: c.description ?? "Widerspruch klären",
          beschreibung: c.description ?? "",
          verantwortlich: null,
          frist: null,
          quelle: `Konflikt #${c.id.slice(0, 6)}`,
          blocker: true,
        }),
      );
      gaps.forEach((g) =>
        handlungsbedarf.push({
          id: `gap-${g.id}`,
          arbeitsmodus: "klaeren",
          objektTyp: "gap",
          titel: g.title,
          beschreibung: g.impact ?? "",
          verantwortlich: null,
          frist: null,
          quelle: `Gap #${g.id.slice(0, 6)}`,
          blocker: false,
        }),
      );
      openPoints.forEach((o) =>
        handlungsbedarf.push({
          id: `op-${o.id}`,
          arbeitsmodus: "klaeren",
          objektTyp: "offener_punkt",
          titel: o.title,
          beschreibung: o.description ?? "",
          verantwortlich: null,
          frist: null,
          quelle: "Offener Punkt",
          blocker: false,
        }),
      );
      tasks
        .filter((t) => t.status !== "done" && t.status !== "completed")
        .forEach((t) =>
          handlungsbedarf.push({
            id: `task-${t.id}`,
            arbeitsmodus: "umsetzen",
            objektTyp: "aufgabe",
            titel: t.title,
            beschreibung: t.description ?? "",
            verantwortlich: null,
            frist: fmtShort(t.due_date) || null,
            quelle: "Aufgabe",
            blocker: false,
          }),
        );
      feedbackRows.forEach((f) =>
        handlungsbedarf.push({
          id: `fb-${f.id}`,
          arbeitsmodus: "pruefen",
          objektTyp: "feedback",
          titel: f.content.slice(0, 80),
          beschreibung: f.content,
          verantwortlich: null,
          frist: null,
          quelle: "Feedback",
          blocker: false,
        }),
      );
      deps.forEach((d) =>
        handlungsbedarf.push({
          id: `dep-${d.id}`,
          arbeitsmodus: "klaeren",
          objektTyp: "dependency",
          titel: d.description ?? `${d.source_type} → ${d.target_type}`,
          beschreibung: d.description ?? "",
          verantwortlich: null,
          frist: null,
          quelle: `Dependency #${d.id.slice(0, 6)}`,
          blocker: d.dependency_type === "blockiert_durch",
        }),
      );

      // Verlauf
      const eventTypeToErlaubnis = (t: string): VerlaufVM["ereignisTyp"] => {
        if (t === "contradict") return "konflikt";
        if (t === "confirm") return "entscheidung";
        return "aenderung";
      };
      const eventTypeToDelta = (t: string): DeltaTyp => {
        if (t === "confirm") return "bestaetigt";
        if (t === "contradict") return "widersprochen";
        if (t === "replace") return "ersetzt";
        return "neu";
      };
      const verlauf: VerlaufVM[] = events.map((e) => ({
        id: e.id,
        datum: fmtShort(e.created_at),
        delta: eventTypeToDelta(e.event_type),
        ereignisTyp: eventTypeToErlaubnis(e.event_type),
        inhalt: titleFromJson(e.new_value ?? e.previous_value, "Änderung"),
        objekt: "Fakt",
        quelle: "Verstehens-Loop",
      }));

      // Themen
      const decisionsByCanonical = new Map<string, number>();
      decisions.forEach((d) => {
        if (d.canonical_fact_id) {
          decisionsByCanonical.set(d.canonical_fact_id, (decisionsByCanonical.get(d.canonical_fact_id) ?? 0) + 1);
        }
      });
      const openByCanonical = new Map<string, number>();
      openPoints.forEach((o) => {
        if (o.canonical_fact_id) {
          openByCanonical.set(o.canonical_fact_id, (openByCanonical.get(o.canonical_fact_id) ?? 0) + 1);
        }
      });
      const themen: ThemaVM[] = topics.map((t) => ({
        id: t.id,
        name: t.name,
        beschreibung: t.description ?? "",
        entscheidungen: t.canonical_fact_id ? decisionsByCanonical.get(t.canonical_fact_id) ?? 0 : 0,
        offenePunkte: t.canonical_fact_id ? openByCanonical.get(t.canonical_fact_id) ?? 0 : 0,
        dokumente: 0,
      }));

      // Dokumente
      const dokumente: DokumentVM[] = assets.map((a) => ({
        id: a.id,
        name: a.file_name,
        typ: a.file_type,
        version: numberFromJson(a.metadata, "version") ?? 1,
        datum: fmtShort(a.created_at),
        thema: stringFromJson(a.metadata, "thema"),
      }));

      // Stakeholder
      const stakeholderVMs: StakeholderVM[] = stakeholders.map((s) => {
        const personRow = (s as { persons?: { name?: string; role?: string } | null }).persons ?? null;
        const orgRow = (s as { organizations?: { name?: string } | null }).organizations ?? null;
        return {
          id: s.id,
          name: personRow?.name ?? orgRow?.name ?? "—",
          rolle: s.role ?? personRow?.role ?? "",
          org: orgRow?.name ?? "",
        };
      });

      // Stats
      const nextDeadline = deadlines.find((d) => new Date(d.due_date).getTime() > Date.now());
      const allTimes = [
        p.updated_at,
        ...canonical.map((c) => c.updated_at),
        ...events.map((e) => e.created_at),
        ...assets.map((a) => a.updated_at),
      ].filter(Boolean);
      const lastChange = allTimes.length
        ? allTimes.reduce((max, t) => (new Date(t).getTime() > new Date(max).getTime() ? t : max))
        : p.updated_at;
      const budgetFact = canonical.find((c) => {
        const v = c.content as Record<string, unknown> | null;
        return v && (v.kind === "budget" || (typeof v.label === "string" && v.label.toLowerCase().includes("budget")));
      });

      // Lagetext — Maschinen-Codes ("Snapshot nach commit:stakeholder:add")
      // werden hier in lesbare Sprache übersetzt, damit Altdaten auch funktionieren.
      const rawSummary = snapshotRes.data?.[0]?.summary as string | undefined;
      const snapshotSummary = humanizeSnapshotSummary(rawSummary);
      const fallbackLage =
        konflikte.length || gapVMs.length || handlungsbedarf.length
          ? `${handlungsbedarf.length} offen, ${konflikte.length} Konflikt${
              konflikte.length === 1 ? "" : "e"
            }, ${gapVMs.length} Lücke${gapVMs.length === 1 ? "" : "n"}.`
          : "Noch keine Erkenntnisse — leg etwas ab und ich fange an zu verstehen.";

      const isEmpty =
        canonical.length === 0 &&
        events.length === 0 &&
        assets.length === 0 &&
        decisions.length === 0 &&
        tasks.length === 0;

      const vm: ProjectViewModel = {
        id: p.id,
        name: p.name,
        status: p.status,
        description: p.description ?? "",
        lagetext: snapshotSummary ?? fallbackLage,
        outcome: outcomeRes.data?.[0]
          ? {
              erfolgskriterium: outcomeRes.data[0].success_criteria,
              nogos: outcomeRes.data[0].no_gos ?? [],
            }
          : null,
        stats: {
          letzteAenderung: formatRelative(lastChange) || "—",
          naechsterTermin: nextDeadline ? fmtDate(nextDeadline.due_date) : "—",
          budget: budgetFact ? titleFromJson(budgetFact.content, "—") : "—",
        },
        konflikte,
        gaps: gapVMs,
        dependencies: depVMs,
        handlungsbedarf,
        verlauf,
        themen,
        dokumente,
        stakeholder: stakeholderVMs,
      };

      setProject(vm);
      setStatus(isEmpty ? "empty" : "ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    }
  }, [projectId, userId]);

  // Initial + Re-Load
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, reloadKey.current]);

  // Realtime: invalidiert auf jede relevante Änderung → Reload
  useEffect(() => {
    if (!projectId || !userId) return;
    const tables = [
      "canonical_facts",
      "change_events",
      "tasks",
      "decisions",
      "deadlines",
      "gap_signals",
      "dependencies",
      "contradictions",
      "assets",
      "outcome_signals",
      "topics",
      "project_stakeholder_links",
      "open_points",
      "feedback",
      "project_state_snapshots",
    ] as const;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const trigger = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => load(), 250);
    };

    const channel = supabase.channel(`project-${projectId}`);
    tables.forEach((t) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: t, filter: `project_id=eq.${projectId}` },
        trigger,
      );
    });
    // Auch das Projekt selbst (Rename, Status-Wechsel, Delete) live verfolgen.
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "projects", filter: `id=eq.${projectId}` },
      trigger,
    );
    channel.subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [projectId, userId, load]);

  return { status, project, error, vanished };
}
