// =============================================================================
//  AppSidebar — persistente 240px-Sidebar.
//  Home: ohne Mini-Entity (Entity ist im Zentrum).
//  Projekt-Detail: mit Mini-Entity oben (Klick = zurück zur Home / Entität).
// =============================================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Archive, ChevronRight, RotateCcw } from "lucide-react";
import type { DemoProject, ProjectSignal } from "@/data/demoProjects";
import EntityRoot from "@/components/entity/EntityRoot";
import { useArchivedProjects } from "@/lib/project/useArchivedProjects";
import { useProjectActions } from "@/lib/object-actions/useObjectActions";

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
  const [entityHover, setEntityHover] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const { projects: archived } = useArchivedProjects(archiveOpen);
  const projectActions = useProjectActions();
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
        background: "var(--surface-0)",
        borderRight: "1px solid var(--hair)",
      }}
    >
      {showMiniEntity && (
        <button
          type="button"
          onClick={handleEntityClick}
          onMouseEnter={() => setEntityHover(true)}
          onMouseLeave={() => setEntityHover(false)}
          className="flex items-center gap-3 text-left"
          style={{
            padding: "20px 16px 18px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
          title="Zurück zur Entität"
        >
          <span
            aria-hidden
            style={{
              width: 56,
              height: 56,
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transform: entityHover ? "scale(1.06)" : "scale(1)",
              transition: "transform .2s cubic-bezier(.2,.7,.3,1)",
              pointerEvents: "none",
            }}
          >
            <EntityRoot size="56px" />
          </span>
          <span className="flex flex-col min-w-0">
            <span
              className="mono"
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: "var(--ink-2)",
                letterSpacing: "-.01em",
              }}
            >
              cogni
            </span>
            {(entityHover || pipelineLabel) && (
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  marginTop: 2,
                  letterSpacing: ".04em",
                  textTransform: "uppercase",
                  color: entityHover ? "var(--accent)" : "var(--ink-4)",
                  transition: "color .15s",
                }}
              >
                {entityHover ? "öffnen" : pipelineLabel}
              </span>
            )}
          </span>
        </button>
      )}

      <div style={{ padding: "8px 12px 12px", flex: 1, overflowY: "auto" }}>
        <div
          className="t-micro flex justify-between items-center"
          style={{ padding: "0 8px 10px", color: "var(--ink-3)" }}
        >
          <span>Projekte</span>
          <span className="mono tabular" style={{ fontSize: 11, color: "var(--ink-4)" }}>
            {projects.length}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {projects.map((p) => {
            const isActive = p.id === activeProjectId;
            const signalClass = p.signal ? SIGNAL_TO_DOT[p.signal] : null;
            const signal2Class = p.signal2 ? SIGNAL_TO_DOT[p.signal2] : null;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onProjectSelect(p.id)}
                className="w-full flex items-center text-left"
                style={{
                  padding: "7px 8px",
                  borderRadius: 8,
                  background: isActive ? "var(--surface-3)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  gap: 10,
                }}
              >
                <span
                  className="mono"
                  style={{
                    width: 28,
                    flexShrink: 0,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "-.01em",
                    color: isActive ? "var(--ink-2)" : "var(--ink-4)",
                  }}
                >
                  {p.initial}
                </span>
                <span
                  className="flex-1 truncate"
                  style={{
                    fontSize: 13,
                    color: isActive ? "var(--ink)" : "var(--ink-2)",
                    fontWeight: isActive ? 500 : 400,
                    letterSpacing: "-.005em",
                  }}
                >
                  {p.name}
                </span>
                <span className="flex items-center shrink-0" style={{ gap: 4 }} aria-hidden>
                  {signalClass && <span className={`dot ${signalClass}`} />}
                  {signal2Class && <span className={`dot ${signal2Class}`} />}
                </span>
              </button>
            );
          })}
        </div>

        {onCreateProject && (
          <button
            type="button"
            onClick={onCreateProject}
            className="w-full flex items-center gap-2"
            style={{
              padding: "8px",
              marginTop: 6,
              borderRadius: 8,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--ink-4)",
              fontSize: 13,
            }}
          >
            <Plus size={12} strokeWidth={2.2} />
            <span>Neues Projekt</span>
          </button>
        )}

        {/* Archiv — lazy ausklappbar */}
        <div style={{ marginTop: 8, borderTop: "1px solid var(--hair)", paddingTop: 8 }}>
          <button
            type="button"
            onClick={() => setArchiveOpen((v) => !v)}
            className="w-full flex items-center gap-2"
            style={{
              padding: "8px",
              borderRadius: 8,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--ink-4)",
              fontSize: 13,
            }}
          >
            <ChevronRight
              size={12}
              style={{
                transform: archiveOpen ? "rotate(90deg)" : "none",
                transition: "transform .15s",
              }}
            />
            <Archive size={12} />
            <span>Archiv</span>
            {archiveOpen && archived.length > 0 && (
              <span className="mono tabular" style={{ marginLeft: "auto", fontSize: 11 }}>
                {archived.length}
              </span>
            )}
          </button>

          {archiveOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: 1, marginTop: 2 }}>
              {archived.length === 0 ? (
                <div
                  className="t-small"
                  style={{ padding: "6px 8px 6px 30px", color: "var(--ink-4)" }}
                >
                  Keine archivierten Projekte.
                </div>
              ) : (
                archived.map((p) => (
                  <div
                    key={p.id}
                    className="group w-full flex items-center"
                    style={{ padding: "6px 8px 6px 30px", borderRadius: 8, gap: 8 }}
                  >
                    <button
                      type="button"
                      onClick={() => onProjectSelect(p.id)}
                      className="flex-1 truncate text-left"
                      style={{
                        fontSize: 13,
                        color: "var(--ink-3)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                      }}
                      title={p.name}
                    >
                      {p.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => projectActions.unarchive(p.id)}
                      disabled={projectActions.pending}
                      className="shrink-0"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--ink-4)",
                      }}
                      title="Wiederherstellen"
                    >
                      <RotateCcw size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
