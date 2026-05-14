// =============================================================================
//  PipelineHealth — Live-Übersicht der Pipeline-Events
// -----------------------------------------------------------------------------
//  Liest `pipeline_events` über `inspect-pipeline?recent=N` und gruppiert
//  nach `correlation_id`. Klick auf eine Zeile → Stage-Kette als Detail.
//  Realtime-Subscription auf inserts: neue Events poppen sofort oben rein.
//
//  Bewusst ein eigener Screen (kein OrbLab-Tab) — OrbLab ist Design-Werkzeug,
//  Health ist Beobachtungs-Werkzeug. Trennung schafft Klarheit.
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelative } from "@/lib/format/relativeTime";
import { devlog } from "@/lib/devlog/devlog";

interface CorrelationSummary {
  correlation_id: string;
  count: number;
  fns: string[];
  stages: string[];
  worst_level: "info" | "warn" | "error";
  error_count: number;
  errors?: Array<{ fn: string; stage: string; message: string | null; error: Record<string, unknown> | null }>;
  last_ts: string | null;
  first_ts: string | null;
  total_ms: number;
  asset_id: string | null;
  run_id: string | null;
  project_id: string | null;
  session_id: string | null;
}

interface PipelineEvent {
  id: string;
  ts: string;
  fn: string;
  stage: string;
  level: string;
  correlation_id: string | null;
  duration_ms: number | null;
  message: string | null;
  payload: Record<string, unknown> | null;
  error: Record<string, unknown> | null;
}

const LevelIcon = ({ level }: { level: string }) => {
  if (level === "error") return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
  if (level === "warn") return <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />;
  return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/70" />;
};

const PipelineHealth = () => {
  const [recent, setRecent] = useState<CorrelationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PipelineEvent[]>([]);
  const [filter, setFilter] = useState<"all" | "warn" | "error">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("inspect-pipeline", {
        body: {
          recent: 50,
          ...(filter !== "all" ? { min_level: filter } : {}),
        },
      });
      if (fnErr) throw fnErr;
      const list = (data?.trace?.recent_correlations ?? []) as CorrelationSummary[];
      setRecent(list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      devlog.error("PipelineHealth.load failed", { error: msg });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  // Realtime: neuer Insert → leichte Reload-Schwelle (debounced via timeout).
  useEffect(() => {
    let t: number | undefined;
    const channel = supabase
      .channel("pipeline_events_health")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pipeline_events" }, () => {
        window.clearTimeout(t);
        t = window.setTimeout(() => load(), 800);
      })
      .subscribe();
    return () => { window.clearTimeout(t); supabase.removeChannel(channel); };
  }, [load]);

  const loadDetail = useCallback(async (correlationId: string) => {
    setSelectedId(correlationId);
    setDetail([]);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("inspect-pipeline", {
        body: { correlation_id: correlationId },
      });
      if (fnErr) throw fnErr;
      setDetail((data?.trace?.pipeline_events ?? []) as PipelineEvent[]);
    } catch (err) {
      devlog.error("PipelineHealth.loadDetail failed", { error: err });
    }
  }, []);

  const counts = useMemo(() => ({
    total: recent.length,
    errors: recent.filter((c) => c.worst_level === "error").length,
    warns: recent.filter((c) => c.worst_level === "warn").length,
  }), [recent]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6 lg:py-8 flex flex-col gap-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div className="flex items-baseline gap-3">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link to="/" aria-label="Zurück"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h1 className="text-2xl tracking-tight font-light">Pipeline Health</h1>
            <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
              {counts.total} Korrelationen · {counts.errors} Fehler · {counts.warns} Warnungen
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-border/50 overflow-hidden">
              {(["all", "warn", "error"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs ${
                    filter === f ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:bg-card/40"
                  }`}
                >
                  {f === "all" ? "alle" : f}
                </button>
              ))}
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </header>

        {error && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="py-3 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[480px_1fr] items-start">
          {/* Liste */}
          <Card className="bg-card/30 border-border/50">
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-220px)]">
                <ul className="divide-y divide-border/40">
                  {recent.length === 0 && !loading && (
                    <li className="p-6 text-sm text-muted-foreground text-center">
                      Noch keine Events. Trigger die Pipeline, dann erscheinen sie hier.
                    </li>
                  )}
                  {recent.map((c) => (
                    <li key={c.correlation_id}>
                      <button
                        onClick={() => loadDetail(c.correlation_id)}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-card/40 transition ${
                          selectedId === c.correlation_id ? "bg-card/60" : ""
                        }`}
                      >
                        <LevelIcon level={c.worst_level} />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-xs font-mono text-foreground/90 truncate">
                              {c.fns.join(" → ") || "frontend"}
                            </span>
                            <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                              {c.last_ts ? formatRelative(c.last_ts) : "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{c.count} Stages</span>
                            <span>·</span>
                            <span className="tabular-nums">{c.total_ms}ms</span>
                            {c.asset_id && (<><span>·</span><span className="font-mono">asset {c.asset_id.slice(0, 6)}</span></>)}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground/60 truncate">
                            {c.correlation_id.slice(0, 18)}…
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Detail */}
          <Card className="bg-card/30 border-border/50">
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-220px)]">
                {!selectedId && (
                  <div className="p-8 text-sm text-muted-foreground text-center">
                    Wähle eine Korrelation, um die Stage-Kette zu sehen.
                  </div>
                )}
                {selectedId && detail.length === 0 && (
                  <div className="p-6 text-sm text-muted-foreground">Lade …</div>
                )}
                {detail.length > 0 && (
                  <ol className="divide-y divide-border/40">
                    {detail.map((ev, idx) => (
                      <li key={ev.id} className="px-4 py-3 flex items-start gap-3">
                        <span className="text-[10px] tabular-nums text-muted-foreground/60 mt-0.5 w-6">
                          {idx + 1}
                        </span>
                        <LevelIcon level={ev.level} />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-xs font-mono text-foreground/90">
                              {ev.fn} <span className="text-muted-foreground">·</span> {ev.stage}
                            </span>
                            <span className="text-[10px] text-muted-foreground tabular-nums">
                              {ev.duration_ms ?? 0}ms
                            </span>
                          </div>
                          {ev.message && (
                            <div className="text-xs text-foreground/70">{ev.message}</div>
                          )}
                          {ev.error && (
                            <pre className="text-[10px] text-destructive/90 bg-destructive/5 rounded px-2 py-1 overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(ev.error, null, 2)}
                            </pre>
                          )}
                          {ev.payload && Object.keys(ev.payload).length > 0 && (
                            <details className="text-[10px] text-muted-foreground">
                              <summary className="cursor-pointer hover:text-foreground/80">payload</summary>
                              <pre className="mt-1 bg-card/50 rounded px-2 py-1 overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(ev.payload, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PipelineHealth;
