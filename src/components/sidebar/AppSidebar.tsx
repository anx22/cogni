// =============================================================================
//  AppSidebar — persistente 240px-Sidebar.
//  Home: ohne Mini-Entity (Entity ist im Zentrum).
//  Projekt-Detail: mit Mini-Entity oben (Klick = zurück zur Home).
// =============================================================================

import { useNavigate } from "react-router-dom";
import type { DemoProject, ProjectSignal } from "@/data/demoProjects";

const SIGNAL_TO_DOT: Record<ProjectSignal, string> = {
  conflict: "dot--conflict",
  review: "dot--review",
  action: "dot--action",
  calm: "dot--calm",
};

export interface AppSidebarProps {
  projects: DemoProject[];
  activeProjectId?: string;
  onProjectSelect: (id: string) => void;
  onCreateProject?: () => void;
  showMiniEntity?: boolean;
  pipelineLabel?: string | null;
  onEntityClick?: () => void;
}

const AppSidebar = ({
  projects,
  activeProjectId,
  onProjectSelect,
  onCreateProject,
  showMiniEntity = false,
  pipelineLabel = null,
  onEntityClick,
}: AppSidebarProps) => {
  const navigate = useNavigate();
  const handleEntityClick = () => {
    if (onEntityClick) onEntityClick();
    else navigate("/");
  };

  return (
    <aside
      className="hidden md:flex flex-col shrink-0 overflow-hidden"
      style={{
        width: 240,
        minWidth: 240,
        height: "100vh",
        background: "var(--surface-2)",
        borderRight: "1px solid var(--hair)",
      }}
    >
      {showMiniEntity && (
        <button
          type="button"
          onClick={handleEntityClick}
          className="group flex items-center gap-2.5 text-left"
          style={{
            padding: "16px 16px 12px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            borderBottom: "1px solid var(--hair)",
          }}
          title="Zur Entität"
        >
          <span
            aria-hidden
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: `radial-gradient(circle at 35% 35%,
                var(--entity-aurora-d) 0%,
                var(--entity-aurora-a) 30%,
                var(--entity-aurora-b) 65%,
                var(--entity-aurora-c) 100%)`,
              flexShrink: 0,
              animation: "cogni-entity-breathe 6s ease-in-out infinite",
            }}
          />
          <span className="flex flex-col">
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>cogni</span>
            {pipelineLabel ? (
              <span className="t-micro" style={{ color: "var(--sig-review)" }}>{pipelineLabel}</span>
            ) : (
              <span className="t-micro ink-4">bereit</span>
            )}
          </span>
        </button>
      )}

      <div style={{ padding: "12px 8px 8px", flex: 1, overflowY: "auto" }}>
        <div className="t-micro ink-4 flex justify-between items-center" style={{ padding: "0 8px 8px" }}>
          <span>Projekte</span>
          <span>{projects.length}</span>
        </div>

        {projects.map((p) => {
          const isActive = p.id === activeProjectId;
          const signalClass = SIGNAL_TO_DOT[p.signal] ?? "dot--calm";
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onProjectSelect(p.id)}
              className="w-full flex items-center gap-2 text-left"
              style={{
                padding: "6px 8px",
                borderRadius: 8,
                background: isActive ? "var(--surface-3)" : "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span
                className="t-micro shrink-0"
                style={{
                  width: 24,
                  color: isActive ? "var(--ink-3)" : "var(--ink-4)",
                }}
              >
                {p.initial}
              </span>
              <span
                className="t-small flex-1 truncate"
                style={{
                  color: isActive ? "var(--ink)" : "var(--ink-2)",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {p.name}
              </span>
              {p.openCount && p.openCount > 0 ? (
                <span className="t-micro mono ink-4 shrink-0">{p.openCount}</span>
              ) : null}
              <span className={`dot ${signalClass} shrink-0`} aria-hidden />
              {p.signal2 ? (
                <span className={`dot ${SIGNAL_TO_DOT[p.signal2]} shrink-0`} aria-hidden />
              ) : null}
            </button>
          );
        })}

        {onCreateProject && (
          <button
            type="button"
            onClick={onCreateProject}
            className="t-small w-full flex items-center gap-2 mt-1"
            style={{
              padding: "6px 8px",
              borderRadius: 8,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--ink-4)",
            }}
          >
            + Neues Projekt
          </button>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
