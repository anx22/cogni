// =============================================================================
//  ImpactPipelinePanel — rechtes Aside (280px) auf dem Home-Screen.
//
//  Drei Sections:
//    · Letzter Impact — change_events der letzten 24h, neueste 6
//    · Jetzt          — aktiver Pipeline-Status (assets in processing)
//    · Pipeline       — Aggregat aus useProjects() Signal-Counts
//
//  Reine Read-Only-UI. Liest direkt aus Supabase — keine Geschäftslogik.
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/lib/project/useProjects";
import { formatRelative } from "@/lib/format/relativeTime";
import { useRealtimeTables, type RealtimeListener } from "@/lib/realtime/useRealtimeTables";

interface ImpactItem {
  id: string;
  when: string;
  what: string;
  projectName: string;
  projectId: string | null;
}

interface ActivePipelineItem {
  id: string;
  label: string;
  fileType: string | null;
  startedAt: string;
  projectId: string | null;
}

const EVENT_LABELS: Record<string, string> = {
  fact_committed: "Punkt übernommen",
  fact_rejected: "Punkt verworfen",
  fact_updated: "Punkt aktualisiert",
  conflict_resolved: "Widerspruch gelöst",
  gap_filled: "Frage geklärt",
};

const labelForEvent = (eventType: string, payload: Record<string, unknown> | null): string => {
  if (payload && typeof payload === "object") {
    const t =
      (payload as { title?: string; content?: { title?: string } }).title ??
      (payload as { content?: { title?: string } }).content?.title;
    if (t && typeof t === "string") return t;
  }
  return EVENT_LABELS[eventType] ?? eventType.replace(/_/g, " ");
};

const ImpactPipelinePanel = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const navigate = useNavigate();
  const { projects } = useProjects();

  const [impacts, setImpacts] = useState<ImpactItem[]>([]);
  const [active, setActive] = useState<ActivePipelineItem | null>(null);

  const projectNameById = useMemo(() => {
    const m = new Map<string, string>();
    projects.forEach((p) => m.set(p.id, p.name));
    return m;
  }, [projects]);

  const loadImpacts = useMemo(
    () => async () => {
      if (!userId) return;
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data } = await supabase
        .from("change_events")
        .select("id, event_type, new_value, project_id, created_at")
        .eq("user_id", userId)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(6);
      if (!data) return;
      setImpacts(
        data.map((row) => ({
          id: row.id,
          when: formatRelative(row.created_at ?? undefined),
          what: labelForEvent(
            row.event_type as string,
            row.new_value as Record<string, unknown> | null,
          ),
          projectName: row.project_id ? (projectNameById.get(row.project_id) ?? "—") : "—",
          projectId: row.project_id ?? null,
        })),
      );
    },
    [userId, projectNameById],
  );

  const loadActive = useMemo(
    () => async () => {
      if (!userId) return;
      const { data } = await supabase
        .from("assets")
        .select(
          "id, file_type, file_name, created_at, processing_status, understanding_status, project_id",
        )
        .eq("user_id", userId)
        .or("processing_status.eq.processing,understanding_status.eq.running")
        .order("created_at", { ascending: false })
        .limit(1);
      const row = data?.[0];
      if (!row) {
        setActive(null);
        return;
      }
      setActive({
        id: row.id,
        label: row.file_name ?? "Unbenannt",
        fileType: row.file_type,
        startedAt: row.created_at ?? new Date().toISOString(),
        projectId: row.project_id ?? null,
      });
    },
    [userId],
  );

  useEffect(() => {
    loadImpacts();
    loadActive();
  }, [loadImpacts, loadActive]);

  const listeners = useMemo<RealtimeListener[]>(() => {
    if (!userId) return [];
    const filter = `user_id=eq.${userId}`;
    return [
      { table: "change_events", filter },
      { table: "assets", filter },
    ];
  }, [userId]);

  useRealtimeTables(userId ? `home-impact-${userId}` : null, listeners, {
    onTrigger: () => {
      loadImpacts();
      loadActive();
    },
    debounceMs: 350,
  });

  // Pipeline-Aggregat aus useProjects()
  const pipeline = useMemo(() => {
    let conflicts = 0;
    let review = 0;
    let _actionN = 0;
    projects.forEach((p) => {
      const sigs = [p.signal, p.signal2].filter(Boolean) as string[];
      if (sigs.includes("conflict")) conflicts += 1;
      if (sigs.includes("review")) review += 1;
      if (sigs.includes("action")) _actionN += 1;
    });
    return {
      intake: active ? 1 : 0,
      processing: active ? 1 : 0,
      review,
      conflicts,
    };
  }, [projects, active]);

  return (
    <aside
      className="hidden xl:flex flex-col shrink-0"
      style={{
        width: 280,
        minWidth: 280,
        height: "100vh",
        borderLeft: "1px solid var(--hair)",
        padding: "32px 24px",
        gap: 24,
        overflowY: "auto",
      }}
    >
      {/* Letzter Impact */}
      <section>
        <div className="t-micro" style={{ color: "var(--ink-3)", marginBottom: 12 }}>
          Letzter Impact
        </div>
        {impacts.length === 0 ? (
          <div className="t-small" style={{ color: "var(--ink-4)" }}>
            Noch keine Aktivität in den letzten 24h.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {impacts.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => it.projectId && navigate(`/projekt/${it.projectId}`)}
                disabled={!it.projectId}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: it.projectId ? "pointer" : "default",
                  opacity: 1,
                }}
                className={it.projectId ? "group" : ""}
              >
                <div className="t-micro mono" style={{ color: "var(--ink-4)" }}>
                  {it.when}
                </div>
                <div
                  className="t-body group-hover:underline"
                  style={{ color: "var(--ink)", lineHeight: 1.4 }}
                >
                  {it.what}
                </div>
                <div
                  className="t-small flex items-center"
                  style={{ color: "var(--ink-3)", gap: 6 }}
                >
                  <ArrowRight size={11} /> {it.projectName}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="hairline" />

      {/* Jetzt — nur wenn aktiv */}
      {active && (
        <>
          <section>
            <div className="t-micro" style={{ color: "var(--ink-3)", marginBottom: 10 }}>
              Jetzt
            </div>
            <button
              type="button"
              onClick={() => active.projectId && navigate(`/projekt/${active.projectId}`)}
              disabled={!active.projectId}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                background: "var(--surface-2)",
                border: "1px solid var(--hair)",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                textAlign: "left",
                cursor: active.projectId ? "pointer" : "default",
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  marginTop: 3,
                  border: "1.5px solid var(--sig-action)",
                  borderTopColor: "transparent",
                  animation: "cogni-orb-rotate-slow 1.2s linear infinite",
                  flex: "0 0 auto",
                }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="t-small" style={{ color: "var(--ink-3)" }}>
                  wird ausgewertet · {formatRelative(active.startedAt)}
                </div>
                <div
                  className="t-small"
                  style={{
                    color: "var(--ink)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginTop: 2,
                  }}
                >
                  {active.label}
                </div>
              </div>
            </button>
          </section>
          <div className="hairline" />
        </>
      )}

      {/* Pipeline */}
      <section>
        <div className="t-micro" style={{ color: "var(--ink-3)", marginBottom: 10 }}>
          Pipeline
        </div>
        {[
          { label: "Eingang", count: pipeline.intake, dot: "calm" },
          { label: "Auswertung", count: pipeline.processing, dot: "action" },
          { label: "Zu klären", count: pipeline.review, dot: "review" },
          { label: "Widerspruch", count: pipeline.conflicts, dot: "conflict" },
        ].map((row, i) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "7px 0",
              borderBottom: i < 3 ? "1px solid var(--hair)" : "none",
            }}
          >
            <span className={`dot dot--${row.dot}`} aria-hidden />
            <span
              className="t-small"
              style={{
                flex: 1,
                color: row.count > 0 ? "var(--ink)" : "var(--ink-3)",
                fontWeight: row.count > 0 ? 500 : 400,
              }}
            >
              {row.label}
            </span>
            <span
              className="t-small mono tabular"
              style={{
                color: row.count > 0 ? "var(--ink-2)" : "var(--ink-4)",
              }}
            >
              {row.count}
            </span>
          </div>
        ))}
      </section>
    </aside>
  );
};

export default ImpactPipelinePanel;
