/* eslint-disable @typescript-eslint/no-explicit-any */
import { fmtShort } from "@/lib/format/dateFormatters";
import type { HandlungsbedarfVM } from "../types";

export function toHandlungsbedarf(rows: {
  decisions: any[];
  contradictions: any[];
  gaps: any[];
  openPoints: any[];
  tasks: any[];
  feedbackRows: any[];
  deps: any[];
}): HandlungsbedarfVM[] {
  const out: HandlungsbedarfVM[] = [];

  rows.decisions
    .filter((d) => d.status === "draft")
    .forEach((d) =>
      out.push({
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
  rows.contradictions.forEach((c) =>
    out.push({
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
  rows.gaps.forEach((g) =>
    out.push({
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
  rows.openPoints.forEach((o) =>
    out.push({
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
  rows.tasks
    .filter((t) => t.status !== "done" && t.status !== "completed")
    .forEach((t) =>
      out.push({
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
  rows.feedbackRows.forEach((f) =>
    out.push({
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
  rows.deps.forEach((d) =>
    out.push({
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

  return out;
}
