import { useMemo, useState } from "react";
import { Flag, AlertCircle, HelpCircle, Link2, Zap, GitMerge } from "lucide-react";
import { useDialog } from "@/components/dialog/DialogProvider";
import {
  buildHandlungsbedarfSession,
  buildThemaMergeSession,
  buildKonfliktSession,
  buildGapSession,
  buildDependencySession,
} from "@/lib/dialog/sessionFactories";
import type { Arbeitsmodus, HandlungsbedarfVM, KonfliktVM, ObjektTyp } from "@/lib/project/types";
import KonfliktPopover from "./KonfliktPopover";

type Item = HandlungsbedarfVM;
type Filter = "alle" | "blocker" | "ohne_frist";

const MODE_META: Record<Arbeitsmodus, { label: string; color: string }> = {
  entscheiden: { label: "Entscheiden", color: "var(--sig-action)" },
  klaeren: { label: "Klären", color: "var(--sig-review)" },
  umsetzen: { label: "Umsetzen", color: "var(--ink-3)" },
  pruefen: { label: "Prüfen", color: "var(--accent)" },
};

const ORDER: Arbeitsmodus[] = ["entscheiden", "klaeren", "umsetzen", "pruefen"];

function TypeIcon({ kind }: { kind: ObjektTyp }) {
  const Icon =
    kind === "konflikt"
      ? AlertCircle
      : kind === "gap"
        ? HelpCircle
        : kind === "feedback"
          ? Zap
          : kind === "dependency"
            ? Link2
            : kind === "topic_merge"
              ? GitMerge
              : Flag;
  return <Icon className="w-3.5 h-3.5" />;
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function firstName(name: string | null): string {
  return name?.split(/\s+/)[0] ?? "";
}

const HandlungsbedarfList = ({
  items,
  projectId,
}: {
  items: Item[];
  projectId?: string | null;
}) => {
  const [filter, setFilter] = useState<Filter>("alle");

  const filtered = useMemo(() => {
    if (filter === "blocker") return items.filter((i) => i.blocker);
    if (filter === "ohne_frist") return items.filter((i) => !i.frist);
    return items;
  }, [items, filter]);

  const grouped = ORDER.map((m) => ({
    modus: m,
    list: filtered.filter((i) => i.arbeitsmodus === m),
  }));

  return (
    <section>
      <header className="flex items-baseline" style={{ gap: 14, marginBottom: 22 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: "-.02em",
            color: "var(--ink)",
          }}
        >
          Handlungsbedarf
        </h2>
        <span className="mono tabular" style={{ fontSize: 14, color: "var(--ink-3)" }}>
          {items.length}
        </span>
        <div style={{ flex: 1 }} />
        <div className="flex" style={{ gap: 4 }}>
          <FilterBtn active={filter === "alle"} onClick={() => setFilter("alle")}>
            Alle
          </FilterBtn>
          <FilterBtn active={filter === "blocker"} onClick={() => setFilter("blocker")}>
            Nur Blocker
          </FilterBtn>
          <FilterBtn active={filter === "ohne_frist"} onClick={() => setFilter("ohne_frist")}>
            Ohne Frist
          </FilterBtn>
        </div>
      </header>

      <div className="flex flex-col" style={{ gap: 24 }}>
        {grouped.map(({ modus, list }) => {
          if (!list.length) return null;
          const meta = MODE_META[modus];
          return (
            <div key={modus}>
              <div
                className="flex items-center"
                style={{
                  gap: 10,
                  padding: "0 0 8px 0",
                  fontSize: 12,
                  color: "var(--ink-3)",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 2,
                    background: meta.color,
                  }}
                />
                <span className="t-micro" style={{ color: meta.color, letterSpacing: ".06em" }}>
                  {meta.label}
                </span>
                <span className="mono tabular" style={{ color: "var(--ink-4)" }}>
                  {list.length}
                </span>
                <div
                  style={{
                    flex: 1,
                    marginLeft: 10,
                    height: 1,
                    background: "var(--hair)",
                  }}
                />
              </div>
              <div className="flex flex-col">
                {list.map((a, i) => (
                  <ActionRow
                    key={a.id}
                    item={a}
                    last={i === list.length - 1}
                    projectId={projectId}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const FilterBtn = ({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      height: 28,
      padding: "0 10px",
      borderRadius: 8,
      border: "1px solid var(--hair)",
      background: active ? "var(--surface-3)" : "transparent",
      color: active ? "var(--ink)" : "var(--ink-3)",
      fontSize: 12,
      cursor: "pointer",
    }}
  >
    {children}
  </button>
);

function buildKonfliktDrillSession(item: Item) {
  const k = item.konfliktRef;
  const empty: KonfliktVM["faktA"] = { inhalt: "", datum: "", quelle: "", mode: "abgeleitet" };
  return buildKonfliktSession({
    id: item.id.replace(/^con-/, ""),
    title: item.titel,
    beschreibung: item.beschreibung,
    faktA: k?.faktA ?? empty,
    faktB: k?.faktB ?? empty,
    empfehlung: k?.empfehlung ?? null,
  });
}

const ActionRow = ({
  item,
  last,
  projectId,
}: {
  item: Item;
  last: boolean;
  projectId?: string | null;
}) => {
  const { openDialog } = useDialog();
  const [popover, setPopover] = useState<DOMRect | null>(null);

  const openDrilldown = () => {
    if (item.objektTyp === "topic_merge" && item.topicMerge) {
      openDialog(
        buildThemaMergeSession({
          titelA: item.topicMerge.titelA,
          beschreibungA: item.topicMerge.beschreibungA,
          titelB: item.topicMerge.titelB,
          beschreibungB: item.topicMerge.beschreibungB,
          merge: {
            candidateId: item.topicMerge.candidateId,
            sourceTopicId: item.topicMerge.sourceTopicId,
            targetTopicId: item.topicMerge.targetTopicId,
          },
        }),
      );
      return;
    }
    if (item.objektTyp === "konflikt") {
      openDialog(buildKonfliktDrillSession(item));
      return;
    }
    if (item.objektTyp === "gap") {
      openDialog(
        buildGapSession({
          id: item.id,
          titel: item.titel,
          wirkung: item.beschreibung,
          betrifft: "",
          lebensdauer: "",
          empfehlung: item.empfehlung ?? null,
        }),
      );
      return;
    }
    if (item.objektTyp === "dependency") {
      openDialog(
        buildDependencySession(
          {
            id: item.id,
            titel: item.titel,
            beschreibung: item.beschreibung,
            quelle: item.quelle,
            empfehlung: item.empfehlung ?? null,
          },
          projectId ?? null,
        ),
      );
      return;
    }
    openDialog(
      buildHandlungsbedarfSession(
        { ...item, empfehlung: item.empfehlung ?? null },
        projectId ?? null,
      ),
    );
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Tier-1 Konflikt → Popover (Schnellentscheidung)
    if (
      item.objektTyp === "konflikt" &&
      item.konfliktRef?.empfehlung?.tier === 1 &&
      item.konfliktRef.empfehlung.gewinner !== null
    ) {
      setPopover(e.currentTarget.getBoundingClientRect());
      return;
    }
    openDrilldown();
  };

  return (
    <>
      {popover && item.konfliktRef?.empfehlung?.gewinner && (
        <KonfliktPopover
          konflikt={item.konfliktRef}
          anchor={popover}
          onClose={() => setPopover(null)}
          onOpenDrill={() => {
            setPopover(null);
            openDrilldown();
          }}
        />
      )}
      <button
        type="button"
        onClick={handleClick}
        className="w-full flex items-center text-left"
        style={{
          gap: 14,
          padding: "13px 4px",
          borderBottom: last ? "none" : "1px solid var(--hair)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        {item.blocker && (
          <span
            aria-hidden
            title="Blocker"
            style={{
              width: 3,
              height: 32,
              borderRadius: 2,
              background: "var(--sig-conflict)",
              flex: "0 0 auto",
              marginLeft: -8,
            }}
          />
        )}
        <span
          title={item.objektTyp}
          className="inline-flex items-center justify-center shrink-0"
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: "var(--surface-2)",
            color: "var(--ink-3)",
          }}
        >
          <TypeIcon kind={item.objektTyp} />
        </span>

        <div className="flex-1 min-w-0">
          <div
            className="flex items-center"
            style={{
              gap: 8,
              fontSize: 14.5,
              color: "var(--ink)",
              fontWeight: 450,
              letterSpacing: "-.01em",
            }}
          >
            <span className="truncate">{item.titel}</span>
            {item.manuell && (
              <span title="manuell ergänzt" style={{ color: "var(--ink-4)", fontSize: 11 }}>
                ·
              </span>
            )}
          </div>
          {item.beschreibung && (
            <div
              style={{
                marginTop: 2,
                fontSize: 12.5,
                color: "var(--ink-3)",
                lineHeight: 1.4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.beschreibung}
            </div>
          )}
        </div>

        <div
          className="flex items-center shrink-0"
          style={{ gap: 16, fontSize: 12, color: "var(--ink-3)" }}
        >
          {item.verantwortlich && (
            <span className="inline-flex items-center" style={{ gap: 6 }}>
              <span
                className="inline-flex items-center justify-center"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  background: "var(--surface-3)",
                  fontFamily: "Geist Mono, monospace",
                  fontSize: 9,
                  color: "var(--ink-2)",
                }}
              >
                {initials(item.verantwortlich)}
              </span>
              <span style={{ color: "var(--ink-2)" }}>{firstName(item.verantwortlich)}</span>
            </span>
          )}
          {item.frist && (
            <span className="mono tabular" style={{ color: "var(--ink-2)" }}>
              {item.frist}
            </span>
          )}
          {item.quelle && (
            <span className="src" title={item.quelle}>
              {item.quelle}
            </span>
          )}
        </div>
      </button>
    </>
  );
};

export default HandlungsbedarfList;
