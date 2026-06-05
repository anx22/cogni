/* eslint-disable @typescript-eslint/no-explicit-any */
import { fmtShort, ageInDays } from "@/lib/format/dateFormatters";
import type { HandlungsbedarfVM } from "../types";
import { deriveGapEmpfehlung } from "./gaps";
import { deriveDepEmpfehlung } from "./dependencies";

// Quelle wird als fachliche Kategorie angezeigt — keine internen IDs.
// Wer wirklich die ID braucht, findet sie im Drill-Header (kontextuell).
export function toHandlungsbedarf(rows: {
  decisions: any[];
  contradictions: any[];
  gaps: any[];
  openPoints: any[];
  tasks: any[];
  feedbackRows: any[];
  deps: any[];
  topicMergeCandidates?: any[];
  /** Eskalierte (zurückgestellte) Review-Cases dieses Projekts — wieder öffenbar. */
  zurueckgestellt?: any[];
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
      quelle: "Widerspruch",
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
      quelle: "Offene Frage",
      blocker: false,
      empfehlung: deriveGapEmpfehlung(
        g.affects ?? null,
        g.impact ?? null,
        ageInDays(g.detected_at),
      ),
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
      quelle: "Hinweis",
      blocker: false,
    }),
  );
  rows.deps.forEach((d) =>
    out.push({
      id: `dep-${d.id}`,
      arbeitsmodus: "klaeren",
      objektTyp: "dependency",
      titel: d.description ?? `${d.source_type} hängt an ${d.target_type}`,
      beschreibung: d.description ?? "",
      verantwortlich: null,
      frist: null,
      quelle: "Abhängigkeit",
      blocker: d.dependency_type === "blockiert_durch",
      empfehlung: deriveDepEmpfehlung(d.dependency_type, d.source_type, d.target_type),
    }),
  );

  (rows.zurueckgestellt ?? []).forEach((rc) =>
    out.push({
      id: `esc-${rc.id}`,
      arbeitsmodus: "pruefen",
      objektTyp: "zurueckgestellt",
      titel: rc.title ?? "Zurückgestellte Erkenntnis",
      beschreibung: rc.description ?? "Später erneut entscheiden.",
      verantwortlich: null,
      frist: null,
      quelle: "Zurückgestellt",
      blocker: false,
      reopen: { caseId: rc.id, sessionId: rc.session_id },
    }),
  );

  (rows.topicMergeCandidates ?? []).forEach((c) => {
    const srcName = c.source?.name ?? c.source_name ?? "Thema A";
    const tgtName = c.target?.name ?? c.target_name ?? "Thema B";
    const srcDesc = c.source?.description ?? "";
    const tgtDesc = c.target?.description ?? "";
    out.push({
      id: `merge-${c.id}`,
      arbeitsmodus: "klaeren",
      objektTyp: "topic_merge",
      titel: `Themen verschmelzen? „${srcName}" ↔ „${tgtName}"`,
      beschreibung: "Diese beiden Themen klingen ähnlich — sollen sie zusammengeführt werden?",
      verantwortlich: null,
      frist: null,
      quelle: "Themen",
      blocker: false,
      topicMerge: {
        candidateId: c.id,
        sourceTopicId: c.source_topic_id,
        targetTopicId: c.target_topic_id,
        titelA: srcName,
        beschreibungA: srcDesc,
        titelB: tgtName,
        beschreibungB: tgtDesc,
      },
    });
  });

  return out;
}
