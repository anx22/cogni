import { useEffect, useMemo, useState } from "react";
import { useDevLog } from "@/lib/devlog/useDevLog";
import { CATEGORY_COLOR, type DevLogCategory, type DevLogEntry } from "@/lib/devlog/devlog";
import { cn } from "@/lib/utils";
import InspectorPanel from "./InspectorPanel";

type Tab = "log" | "inspector";

const CATEGORIES: (DevLogCategory | "all")[] = [
  "all",
  "intake",
  "db",
  "edge",
  "realtime",
  "auth",
  "ui",
  "error",
];

export default function DevLogPanel() {
  const { entries, paused, enabled, clear, setPaused } = useDevLog();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("log");
  const [filter, setFilter] = useState<DevLogCategory | "all">("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(
    () => (filter === "all" ? entries : entries.filter((e) => e.category === filter)),
    [entries, filter],
  );

  const errorCount = useMemo(() => entries.filter((e) => e.level === "error").length, [entries]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!enabled) return null;

  return (
    <>
      {/* Trigger-Badge */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-4 right-4 z-[60] flex items-center gap-2 rounded-full",
          "border border-border/40 bg-background/70 backdrop-blur-md px-3 py-1.5",
          "text-[10px] uppercase tracking-widest text-muted-foreground/80",
          "hover:text-foreground hover:border-border/70 transition-colors",
          "shadow-lg shadow-black/30",
        )}
        title="System-Log (dev)"
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            errorCount > 0 ? "bg-destructive animate-pulse" : "bg-emerald-400/70",
          )}
        />
        log · {entries.length}
      </button>

      {open && (
        <div className="fixed inset-0 z-[55] pointer-events-none">
          <div
            className={cn(
              "pointer-events-auto absolute bottom-16 right-4",
              "w-[min(680px,calc(100vw-2rem))] h-[min(540px,70vh)]",
              "flex flex-col rounded-xl border border-border/40",
              "bg-background/85 backdrop-blur-xl shadow-2xl shadow-black/50",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-border/30 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTab("log")}
                  className={cn(
                    "text-xs uppercase tracking-widest transition-colors",
                    tab === "log"
                      ? "text-foreground"
                      : "text-muted-foreground/60 hover:text-foreground",
                  )}
                >
                  System-Log
                </button>
                <span className="text-muted-foreground/30">/</span>
                <button
                  onClick={() => setTab("inspector")}
                  className={cn(
                    "text-xs uppercase tracking-widest transition-colors",
                    tab === "inspector"
                      ? "text-foreground"
                      : "text-muted-foreground/60 hover:text-foreground",
                  )}
                >
                  Inspector
                </button>
                {tab === "log" && (
                  <span className="text-[10px] text-muted-foreground/50 ml-1">
                    {filtered.length}/{entries.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {tab === "log" && (
                  <>
                    <button
                      onClick={() => setPaused(!paused)}
                      className="rounded px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    >
                      {paused ? "▶ resume" : "⏸ pause"}
                    </button>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(JSON.stringify(filtered, null, 2))
                      }
                      className="rounded px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    >
                      copy
                    </button>
                    <button
                      onClick={clear}
                      className="rounded px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    >
                      clear
                    </button>
                  </>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="rounded px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  esc
                </button>
              </div>
            </div>

            {tab === "inspector" ? (
              <InspectorPanel />
            ) : (
              <>
                {/* Filter */}
                <div className="flex flex-wrap gap-1 border-b border-border/30 px-3 py-2">
                  {CATEGORIES.map((c) => {
                    const active = filter === c;
                    const color = c === "all" ? "#94a3b8" : CATEGORY_COLOR[c];
                    return (
                      <button
                        key={c}
                        onClick={() => setFilter(c)}
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider transition-colors border",
                          active
                            ? "border-border/60 bg-muted/40 text-foreground"
                            : "border-transparent text-muted-foreground/70 hover:text-foreground",
                        )}
                        style={active ? { boxShadow: `inset 0 0 0 1px ${color}40` } : undefined}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>

                {/* Liste */}
                <div className="flex-1 overflow-y-auto px-2 py-1 font-mono text-[11px]">
                  {filtered.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground/50 text-xs">
                      keine Einträge
                    </div>
                  ) : (
                    filtered
                      .slice()
                      .reverse()
                      .map((e) => (
                        <Row
                          key={e.id}
                          entry={e}
                          open={expanded.has(e.id)}
                          onToggle={() =>
                            setExpanded((prev) => {
                              const n = new Set(prev);
                              if (n.has(e.id)) n.delete(e.id);
                              else n.add(e.id);
                              return n;
                            })
                          }
                        />
                      ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Row({
  entry,
  open,
  onToggle,
}: {
  entry: DevLogEntry;
  open: boolean;
  onToggle: () => void;
}) {
  const color = CATEGORY_COLOR[entry.category];
  const time =
    new Date(entry.ts).toLocaleTimeString("de-DE", { hour12: false }) +
    "." +
    String(entry.ts % 1000).padStart(3, "0");
  const hasPayload = entry.payload !== undefined;

  return (
    <div
      className={cn(
        "group rounded px-2 py-1 hover:bg-muted/30 transition-colors",
        entry.level === "error" && "bg-destructive/10",
      )}
    >
      <button
        type="button"
        onClick={hasPayload ? onToggle : undefined}
        className={cn(
          "flex w-full items-start gap-2 text-left",
          hasPayload ? "cursor-pointer" : "cursor-default",
        )}
      >
        <span className="text-muted-foreground/50 shrink-0">{time}</span>
        <span
          className="shrink-0 rounded px-1.5 text-[9px] uppercase tracking-wider"
          style={{ color, backgroundColor: `${color}15` }}
        >
          {entry.category}
        </span>
        <span
          className={cn(
            "flex-1 break-words",
            entry.level === "error" ? "text-destructive" : "text-foreground/90",
          )}
        >
          {entry.message}
        </span>
        {hasPayload && (
          <span className="text-muted-foreground/40 shrink-0">{open ? "▾" : "▸"}</span>
        )}
      </button>
      {hasPayload && open && (
        <pre className="mt-1 ml-[7.5rem] max-h-64 overflow-auto rounded bg-muted/40 p-2 text-[10px] text-muted-foreground whitespace-pre-wrap break-all">
          {JSON.stringify(entry.payload, null, 2)}
        </pre>
      )}
    </div>
  );
}
