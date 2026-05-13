import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type InspectorKind = "pipeline" | "graphiti" | "langsmith" | "railway";

interface AssetRow { id: string; file_name: string; created_at: string; understanding_status: string }
interface RunRow { id: string; status: string; current_node: string | null; created_at: string; asset_id: string | null }
interface ProjectRow { id: string; name: string }

interface RailwayProject { id: string; name: string; services: { edges: { node: { id: string; name: string } }[] }; environments: { edges: { node: { id: string; name: string } }[] } }
interface RailwayDeployment { id: string; status: string; createdAt: string; staticUrl?: string }

const TABS: { kind: InspectorKind; label: string }[] = [
  { kind: "pipeline", label: "Pipeline" },
  { kind: "graphiti", label: "Graphiti" },
  { kind: "langsmith", label: "LangSmith" },
  { kind: "railway", label: "Railway" },
];

export default function InspectorPanel() {
  const params = useParams();
  const routeProjectId = params.id ?? params.projectId ?? "";

  const [active, setActive] = useState<InspectorKind>("pipeline");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  // shared dropdowns data
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [runs, setRuns] = useState<RunRow[]>([]);

  // pipeline
  const [pipelineMode, setPipelineMode] = useState<"asset" | "project" | "run">("project");
  const [selProject, setSelProject] = useState(routeProjectId);
  const [selAsset, setSelAsset] = useState("");
  const [selRun, setSelRun] = useState("");

  // graphiti
  const [gMode, setGMode] = useState<"health" | "episodes" | "search">("episodes");
  const [gQuery, setGQuery] = useState("");

  // langsmith
  const [lsRun, setLsRun] = useState("");

  // railway
  const [rwProjects, setRwProjects] = useState<RailwayProject[]>([]);
  const [rwSelProject, setRwSelProject] = useState("");
  const [rwSelService, setRwSelService] = useState("");
  const [rwSelEnv, setRwSelEnv] = useState("");
  const [rwDeployments, setRwDeployments] = useState<RailwayDeployment[]>([]);
  const [rwSelDeployment, setRwSelDeployment] = useState("");

  // ── Load dropdown data once ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [{ data: pr }, { data: as }, { data: rs }] = await Promise.all([
        supabase.from("projects").select("id, name").order("updated_at", { ascending: false }).limit(50),
        supabase.from("assets").select("id, file_name, created_at, understanding_status").order("created_at", { ascending: false }).limit(30),
        supabase.from("aol_runs").select("id, status, current_node, created_at, asset_id").order("created_at", { ascending: false }).limit(30),
      ]);
      setProjects(pr ?? []);
      setAssets(as ?? []);
      setRuns(rs ?? []);
      if (!selProject && routeProjectId) setSelProject(routeProjectId);
      else if (!selProject && pr && pr[0]) setSelProject(pr[0].id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = (kind: InspectorKind) => {
    setActive(kind);
    setResult(null);
    setError(null);
  };

  const callFn = async (fn: string, body: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke(fn, { body });
      if (error) throw error;
      setResult(data);
      return data;
    } catch (e) {
      setError(String((e as Error).message ?? e));
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ── Run handlers ──────────────────────────────────────────────────────
  const runPipeline = () => {
    const body: Record<string, unknown> = {};
    if (pipelineMode === "asset" && selAsset) body.asset_id = selAsset;
    if (pipelineMode === "project" && selProject) body.project_id = selProject;
    if (pipelineMode === "run" && selRun) body.run_id = selRun;
    if (Object.keys(body).length === 0) { setError("Auswahl fehlt"); return; }
    callFn("inspect-pipeline", body);
  };

  const runGraphiti = () => {
    if (gMode === "health") return callFn("inspect-graphiti", { action: "health" });
    if (!selProject) { setError("Projekt wählen"); return; }
    callFn("inspect-graphiti", {
      action: gMode,
      project_id: selProject,
      query: gMode === "search" ? gQuery : undefined,
      limit: 20,
    });
  };

  const runLangsmith = () => {
    if (lsRun) return callFn("inspect-langsmith", { action: "get", run_id: lsRun });
    callFn("inspect-langsmith", { action: "list", thread_id: selRun || undefined, limit: 25 });
  };

  // Railway cascading
  const loadRailwayProjects = async () => {
    const data = await callFn("inspect-railway", { action: "projects" }) as { projects?: RailwayProject[] } | null;
    if (data?.projects) {
      setRwProjects(data.projects);
      if (data.projects[0]) {
        setRwSelProject(data.projects[0].id);
        setRwSelService(data.projects[0].services?.edges?.[0]?.node.id ?? "");
        setRwSelEnv(data.projects[0].environments?.edges?.[0]?.node.id ?? "");
      }
    }
  };
  const loadRailwayDeployments = async () => {
    if (!rwSelProject || !rwSelService || !rwSelEnv) { setError("Projekt/Service/Env wählen"); return; }
    const data = await callFn("inspect-railway", {
      action: "deployments",
      project_id: rwSelProject, service_id: rwSelService, environment_id: rwSelEnv, limit: 10,
    }) as { deployments?: RailwayDeployment[] } | null;
    if (data?.deployments) {
      setRwDeployments(data.deployments);
      if (data.deployments[0]) setRwSelDeployment(data.deployments[0].id);
    }
  };
  const loadRailwayLogs = () => {
    if (!rwSelDeployment) { setError("Deployment wählen"); return; }
    callFn("inspect-railway", { action: "logs", deployment_id: rwSelDeployment, limit: 100 });
  };

  const rwCurrentProject = useMemo(() => rwProjects.find((p) => p.id === rwSelProject), [rwProjects, rwSelProject]);

  return (
    <div className="flex h-full flex-col text-xs">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/30 px-3 py-2">
        {TABS.map((t) => (
          <button
            key={t.kind}
            onClick={() => reset(t.kind)}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider transition-colors border",
              active === t.kind
                ? "border-border/60 bg-muted/40 text-foreground"
                : "border-transparent text-muted-foreground/70 hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Form area */}
      <div className="flex flex-col gap-2 border-b border-border/30 px-3 py-2.5">
        {active === "pipeline" && (
          <>
            <div className="flex gap-1">
              {(["project", "asset", "run"] as const).map((m) => (
                <button key={m} onClick={() => setPipelineMode(m)}
                  className={cn(
                    "rounded px-2 py-0.5 text-[10px] uppercase tracking-wider border",
                    pipelineMode === m ? "border-border/60 bg-muted/40 text-foreground" : "border-transparent text-muted-foreground/60 hover:text-foreground",
                  )}>
                  {m === "project" ? "Projekt" : m === "asset" ? "Asset" : "AOL-Run"}
                </button>
              ))}
            </div>
            {pipelineMode === "project" && (
              <Select value={selProject} onChange={setSelProject}
                options={projects.map((p) => ({ value: p.id, label: `${p.name}${p.id === routeProjectId ? "  (aktuell)" : ""}` }))}
                placeholder="Projekt wählen" />
            )}
            {pipelineMode === "asset" && (
              <Select value={selAsset} onChange={setSelAsset}
                options={assets.map((a) => ({ value: a.id, label: `${shortDate(a.created_at)}  ${a.file_name}  · ${a.understanding_status}` }))}
                placeholder="Asset wählen" />
            )}
            {pipelineMode === "run" && (
              <Select value={selRun} onChange={setSelRun}
                options={runs.map((r) => ({ value: r.id, label: `${shortDate(r.created_at)}  ${r.status}  · ${r.current_node ?? "—"}` }))}
                placeholder="AOL-Run wählen" />
            )}
            <Button onClick={runPipeline} loading={loading}>Pipeline-Trace</Button>
          </>
        )}

        {active === "graphiti" && (
          <>
            <div className="flex gap-1">
              {(["health", "episodes", "search"] as const).map((m) => (
                <button key={m} onClick={() => setGMode(m)}
                  className={cn(
                    "rounded px-2 py-0.5 text-[10px] uppercase tracking-wider border",
                    gMode === m ? "border-border/60 bg-muted/40 text-foreground" : "border-transparent text-muted-foreground/60 hover:text-foreground",
                  )}>
                  {m}
                </button>
              ))}
            </div>
            {gMode !== "health" && (
              <Select value={selProject} onChange={setSelProject}
                options={projects.map((p) => ({ value: p.id, label: `${p.name}${p.id === routeProjectId ? "  (aktuell)" : ""}` }))}
                placeholder="Projekt (= group_id)" />
            )}
            {gMode === "search" && (
              <Input value={gQuery} onChange={setGQuery} placeholder="Suchbegriff" />
            )}
            <Button onClick={runGraphiti} loading={loading}>Abfragen</Button>
          </>
        )}

        {active === "langsmith" && (
          <>
            <Select value={selRun} onChange={setSelRun}
              options={[{ value: "", label: "(alle Runs des Projects)" }, ...runs.map((r) => ({ value: r.id, label: `${shortDate(r.created_at)}  ${r.status}  · ${r.current_node ?? "—"}` }))]}
              placeholder="thread_id (= aol_runs.id)" />
            <Input value={lsRun} onChange={setLsRun} placeholder="LangSmith run_id (optional, direkt holen)" />
            <Button onClick={runLangsmith} loading={loading}>Traces holen</Button>
          </>
        )}

        {active === "railway" && (
          <>
            {rwProjects.length === 0 ? (
              <Button onClick={loadRailwayProjects} loading={loading}>Railway-Projekte laden</Button>
            ) : (
              <>
                <Select value={rwSelProject} onChange={(v) => {
                  setRwSelProject(v);
                  const p = rwProjects.find((x) => x.id === v);
                  setRwSelService(p?.services?.edges?.[0]?.node.id ?? "");
                  setRwSelEnv(p?.environments?.edges?.[0]?.node.id ?? "");
                  setRwDeployments([]); setRwSelDeployment("");
                }}
                  options={rwProjects.map((p) => ({ value: p.id, label: p.name }))}
                  placeholder="Railway-Projekt" />
                <div className="flex gap-2">
                  <Select value={rwSelService} onChange={setRwSelService}
                    options={(rwCurrentProject?.services.edges ?? []).map((e) => ({ value: e.node.id, label: e.node.name }))}
                    placeholder="Service" />
                  <Select value={rwSelEnv} onChange={setRwSelEnv}
                    options={(rwCurrentProject?.environments.edges ?? []).map((e) => ({ value: e.node.id, label: e.node.name }))}
                    placeholder="Environment" />
                </div>
                <Button onClick={loadRailwayDeployments} loading={loading}>Deployments laden</Button>
                {rwDeployments.length > 0 && (
                  <>
                    <Select value={rwSelDeployment} onChange={setRwSelDeployment}
                      options={rwDeployments.map((d) => ({ value: d.id, label: `${shortDate(d.createdAt)}  ${d.status}` }))}
                      placeholder="Deployment" />
                    <Button onClick={loadRailwayLogs} loading={loading}>Logs holen</Button>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Output */}
      <div className="flex-1 overflow-auto px-3 py-2 font-mono text-[10.5px]">
        {error && <pre className="text-destructive whitespace-pre-wrap break-all">{error}</pre>}
        {result != null && (
          <>
            <div className="flex justify-end mb-1">
              <button onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
                className="rounded border border-border/40 px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground hover:text-foreground">
                copy json
              </button>
            </div>
            <pre className="whitespace-pre-wrap break-all text-muted-foreground">
              {JSON.stringify(result, null, 2)}
            </pre>
          </>
        )}
        {!error && result == null && !loading && (
          <div className="flex h-full items-center justify-center text-muted-foreground/40 text-xs">
            Auswahl treffen → ausführen
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mini UI helpers ───────────────────────────────────────────────────────

function Select({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded border border-border/40 bg-background/40 px-2 py-1 text-[11px] font-mono text-foreground focus:outline-none focus:border-border">
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full rounded border border-border/40 bg-background/40 px-2 py-1 text-[11px] font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-border" />
  );
}

function Button({ onClick, loading, children }: { onClick: () => void; loading?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="self-start rounded bg-foreground/90 px-3 py-1 text-[10px] uppercase tracking-wider text-background disabled:opacity-50 hover:bg-foreground transition-colors">
      {loading ? "lädt …" : children}
    </button>
  );
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })} ${d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;
}
