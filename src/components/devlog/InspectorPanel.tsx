import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type InspectorKind = "pipeline" | "graphiti" | "langsmith" | "railway";

interface Tile {
  kind: InspectorKind;
  label: string;
  fn: string;
  fields: { name: string; placeholder: string }[];
  defaultBody?: Record<string, unknown>;
  buildBody: (fields: Record<string, string>) => Record<string, unknown>;
}

const TILES: Tile[] = [
  {
    kind: "pipeline",
    label: "Pipeline-Trace",
    fn: "inspect-pipeline",
    fields: [
      { name: "asset_id", placeholder: "asset_id (UUID)" },
      { name: "project_id", placeholder: "project_id (UUID)" },
      { name: "run_id", placeholder: "aol_runs.id (UUID)" },
    ],
    buildBody: (f) => {
      const out: Record<string, unknown> = {};
      if (f.asset_id) out.asset_id = f.asset_id;
      if (f.project_id) out.project_id = f.project_id;
      if (f.run_id) out.run_id = f.run_id;
      return out;
    },
  },
  {
    kind: "graphiti",
    label: "Graphiti",
    fn: "inspect-graphiti",
    fields: [
      { name: "project_id", placeholder: "project_id (group_id)" },
      { name: "query", placeholder: "Suchtext (optional)" },
    ],
    buildBody: (f) => ({
      action: f.project_id ? (f.query ? "search" : "episodes") : "health",
      project_id: f.project_id || undefined,
      query: f.query || undefined,
      limit: 20,
    }),
  },
  {
    kind: "langsmith",
    label: "LangSmith",
    fn: "inspect-langsmith",
    fields: [
      { name: "thread_id", placeholder: "aol_runs.id / thread_id (optional)" },
      { name: "run_id", placeholder: "LangSmith run_id (optional)" },
    ],
    buildBody: (f) => f.run_id
      ? { action: "get", run_id: f.run_id }
      : { action: "list", thread_id: f.thread_id || undefined, limit: 25 },
  },
  {
    kind: "railway",
    label: "Railway / AOL",
    fn: "inspect-railway",
    fields: [
      { name: "project_id", placeholder: "Railway project_id (für deployments)" },
      { name: "service_id", placeholder: "service_id" },
      { name: "environment_id", placeholder: "environment_id" },
      { name: "deployment_id", placeholder: "deployment_id (für logs)" },
    ],
    buildBody: (f) => {
      if (f.deployment_id) return { action: "logs", deployment_id: f.deployment_id, limit: 100 };
      if (f.project_id && f.service_id && f.environment_id) {
        return {
          action: "deployments",
          project_id: f.project_id,
          service_id: f.service_id,
          environment_id: f.environment_id,
          limit: 10,
        };
      }
      return { action: "projects" };
    },
  },
];

export default function InspectorPanel() {
  const [active, setActive] = useState<InspectorKind>("pipeline");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const tile = TILES.find((t) => t.kind === active)!;

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const body = tile.buildBody(fields);
      const { data, error } = await supabase.functions.invoke(tile.fn, { body });
      if (error) throw error;
      setResult(data);
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col text-xs">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/30 px-3 py-2">
        {TILES.map((t) => (
          <button
            key={t.kind}
            onClick={() => { setActive(t.kind); setFields({}); setResult(null); setError(null); }}
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

      {/* Form */}
      <div className="flex flex-col gap-1.5 border-b border-border/30 px-3 py-2">
        {tile.fields.map((f) => (
          <input
            key={f.name}
            value={fields[f.name] ?? ""}
            onChange={(e) => setFields((p) => ({ ...p, [f.name]: e.target.value }))}
            placeholder={f.placeholder}
            className="rounded border border-border/40 bg-background/40 px-2 py-1 text-[11px] font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-border"
          />
        ))}
        <div className="flex gap-1.5 pt-1">
          <button
            onClick={run}
            disabled={loading}
            className="rounded bg-foreground/90 px-3 py-1 text-[10px] uppercase tracking-wider text-background disabled:opacity-50"
          >
            {loading ? "lädt …" : "ausführen"}
          </button>
          {result != null && (
            <button
              onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
              className="rounded border border-border/40 px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              copy
            </button>
          )}
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-auto px-3 py-2 font-mono text-[10.5px]">
        {error && <pre className="text-destructive whitespace-pre-wrap break-all">{error}</pre>}
        {result != null && (
          <pre className="whitespace-pre-wrap break-all text-muted-foreground">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
        {!error && result == null && !loading && (
          <div className="flex h-full items-center justify-center text-muted-foreground/40">
            Felder ausfüllen → ausführen
          </div>
        )}
      </div>
    </div>
  );
}
