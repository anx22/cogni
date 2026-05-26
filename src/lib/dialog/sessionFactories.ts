import type { DialogBox, DialogSession } from "./types";

let counter = 0;
const uid = (prefix = "b") => `${prefix}_${Date.now()}_${counter++}`;
const sessionId = () => `s_${Date.now()}_${counter++}`;

const mkBox = (b: Omit<DialogBox, "id" | "state"> & { state?: DialogBox["state"] }): DialogBox => ({
  id: uid(),
  state: b.state ?? "aufgeklappt",
  ...b,
});

const mkSession = (
  anlass: string,
  context: string,
  boxes: DialogBox[],
  mode?: "edit" | "readonly",
): DialogSession => ({
  id: sessionId(),
  anlass,
  context,
  boxes,
  mode,
});

// ---------------------- Konflikt ----------------------
export const buildKonfliktSession = (k: {
  id: string;
  title: string;
  beschreibung: string;
  faktA: string;
  faktB: string;
}): DialogSession =>
  mkSession("Widerspruch klären", k.title, [
    mkBox({
      type: "konflikt",
      title: k.title,
      payload: {
        beschreibung: k.beschreibung,
        faktA: k.faktA,
        faktB: k.faktB,
      },
    }),
  ]);

// ---------------------- Gap ----------------------
export const buildGapSession = (g: {
  id: string;
  titel: string;
  wirkung: string;
  betrifft: string;
  lebensdauer: string;
}): DialogSession =>
  mkSession("Offene Frage", g.titel, [
    mkBox({
      type: "gap",
      title: g.titel,
      payload: {
        wirkung: g.wirkung,
        lebensdauer: g.lebensdauer,
        betrifft: g.betrifft,
        asks: "Was fehlt hier?",
      },
    }),
  ]);

// ---------------------- Handlungsbedarf ----------------------
// Default-Renderer für entscheidung/aufgabe/offener_punkt/feedback.
// Antwort fließt über `__submitIntent` → submitNote → Verstehens-Pipeline.
export const buildHandlungsbedarfSession = (
  item: { id: string; titel: string; beschreibung: string; quelle: string },
  projectId?: string | null,
): DialogSession =>
  mkSession(item.quelle || "Punkt", item.titel, [
    mkBox({
      type: "wissen",
      title: item.titel,
      payload: { sachverhalt: item.beschreibung, quelle: item.quelle },
    }),
    mkBox({
      type: "eingabe",
      title: "Antwort, Kommentar oder Korrektur",
      payload: {
        placeholder: "Was ergänzt du, was korrigierst du?",
        asks: "Antwort hinzufügen",
        __submitIntent: {
          kind: "intake_note" as const,
          projectId: projectId ?? null,
          contextHint: `Antwort auf: ${item.titel} (${item.quelle})`,
          sourceRef: { type: "handlungsbedarf", id: item.id, quelle: item.quelle },
        },
      },
    }),
  ]);

// ---------------------- Dependency ----------------------
// Eigener Drill, der Quelle/Ziel klar zeigt — keine "Dependency #xyz"-Sprache mehr.
export const buildDependencySession = (
  d: {
    id: string;
    titel: string;
    beschreibung: string;
    quelle: string;
  },
  projectId?: string | null,
): DialogSession =>
  mkSession("Abhängigkeit klären", d.titel, [
    mkBox({
      type: "kontext",
      title: d.titel,
      payload: {
        auszug: d.beschreibung || "Diese Aufgabe hängt an einer anderen.",
        begruendung: "So lange die Abhängigkeit besteht, lässt sich der Punkt nicht erledigen.",
      },
    }),
    mkBox({
      type: "eingabe",
      title: "Auflösen oder korrigieren",
      payload: {
        placeholder: "z. B. 'nicht mehr blockiert' oder 'blockiert nun durch …'",
        asks: "Was stimmt?",
        __submitIntent: {
          kind: "intake_note" as const,
          projectId: projectId ?? null,
          contextHint: `Klärung Abhängigkeit: ${d.titel}`,
          sourceRef: { type: "dependency", id: d.id },
        },
      },
    }),
  ]);

// ---------------------- Thema ----------------------
export const buildThemaSession = (t: {
  id: string;
  name: string;
  beschreibung: string;
  entscheidungen: number;
  offenePunkte: number;
  dokumente: number;
  items?: Array<{
    id: string;
    kind: "entscheidung" | "offener_punkt";
    titel: string;
    beschreibung: string;
    status?: string;
  }>;
}): DialogSession => {
  const items = t.items ?? [];
  const itemBoxes: DialogBox[] = items.map((it) =>
    mkBox({
      type: "kontext",
      title: it.titel,
      payload: {
        auszug: it.beschreibung,
        begruendung:
          it.kind === "entscheidung"
            ? `Entscheidung${it.status ? ` · ${it.status}` : ""}`
            : `Offener Punkt${it.status ? ` · ${it.status}` : ""}`,
      },
    }),
  );
  return mkSession(
    "Thema",
    t.name,
    [
      mkBox({
        type: "kontext",
        title: t.name,
        payload: {
          auszug: t.beschreibung,
          begruendung: `${t.entscheidungen} Entscheidung${t.entscheidungen === 1 ? "" : "en"} · ${t.offenePunkte} offen · ${t.dokumente} Dokumente`,
        },
      }),
      ...itemBoxes,
    ],
    "readonly",
  );
};

// ---------------------- Dokument ----------------------
export const buildDokumentSession = (d: {
  id: string;
  name: string;
  typ: string;
  version: number;
  datum: string;
  thema?: string | null;
}): DialogSession =>
  mkSession(
    "Dokument",
    `${d.typ.toUpperCase()} · Version ${d.version}`,
    [
      mkBox({
        type: "kontext",
        title: d.name,
        payload: {
          auszug: `${d.typ.toUpperCase()} · Version ${d.version} · ${d.datum}${d.thema ? ` · Thema: ${d.thema}` : ""}`,
          hinweis: "Vorschau und Versionshistorie folgen in einem späteren Schritt.",
        },
      }),
    ],
    "readonly",
  );

// ---------------------- Verlauf ----------------------
export const buildVerlaufSession = (e: {
  id: string;
  inhalt: string;
  datum: string;
  delta: string;
  ereignisTyp: string;
}): DialogSession =>
  mkSession(
    "Verlaufseintrag",
    e.datum,
    [
      mkBox({
        type: "kontext",
        title: e.inhalt,
        payload: {
          auszug: `${e.delta.toUpperCase()} · ${e.datum}`,
        },
      }),
    ],
    "readonly",
  );

// ---------------------- Feedback ----------------------
export const buildFeedbackSession = (context: string, projectId?: string | null): DialogSession =>
  mkSession("Hinweis", context, [
    mkBox({
      type: "eingabe",
      title: "Was stimmt nicht oder fehlt?",
      payload: {
        placeholder: "Korrektur, Hinweis oder Frage…",
        asks: "Hinweis senden",
        __submitIntent: {
          kind: "intake_note" as const,
          projectId: projectId ?? null,
          contextHint: `Hinweis aus: ${context}`,
          sourceRef: { type: "feedback", quelle: context },
        },
      },
    }),
  ]);

// ---------------------- Source ----------------------
export const buildSourceSession = (quelle: string): DialogSession =>
  mkSession(
    "Quelle",
    quelle,
    [
      mkBox({
        type: "kontext",
        title: quelle,
        payload: {
          auszug: "Quellen-Vorschau folgt.",
        },
      }),
    ],
    "readonly",
  );

// ---------------------- Zuordnung ----------------------
export const buildZuordnungSession = (params: {
  titel: string;
  vorschlag: string;
  kontext?: string;
}): DialogSession =>
  mkSession("Projektzuordnung", params.titel, [
    mkBox({
      type: "kontext",
      title: "Vorgeschlagene Zuordnung",
      payload: {
        auszug: params.vorschlag,
        begruendung: params.kontext ?? "Die Entität hat diese Zuordnung vorgeschlagen.",
      },
    }),
    mkBox({
      type: "zuordnung",
      title: params.titel,
      payload: { vorschlag: params.vorschlag },
    }),
  ]);

// ---------------------- Korrektur ----------------------
export const buildKorrekturSession = (
  params: { titel: string; aktuell: string; quelle: string },
  projectId?: string | null,
): DialogSession =>
  mkSession("Korrektur", params.titel, [
    mkBox({
      type: "kontext",
      title: "Aktueller Stand",
      payload: {
        auszug: params.aktuell,
        begruendung: "Diese Information soll korrigiert werden.",
      },
    }),
    mkBox({
      type: "eingabe",
      title: "Korrektur eingeben",
      payload: {
        placeholder: "Richtige Information…",
        intent: "korrektur",
        asks: "Korrektur senden",
        __submitIntent: {
          kind: "intake_note" as const,
          projectId: projectId ?? null,
          contextHint: `Korrektur zu: ${params.titel} (${params.quelle})`,
          sourceRef: { type: "korrektur", quelle: params.quelle },
        },
      },
    }),
  ]);

// ---------------------- Dokumentversion ----------------------
export const buildVersionsSession = (params: {
  name: string;
  versionen: Array<{ label: string; datum: string }>;
  quelle: string;
}): DialogSession =>
  mkSession("Dokumentversion klären", params.name, [
    mkBox({
      type: "kontext",
      title: params.name,
      payload: {
        auszug: `${params.versionen.length} Version${params.versionen.length === 1 ? "" : "en"} vorhanden`,
        begruendung: "Welche Version ist maßgeblich?",
      },
    }),
    mkBox({
      type: "auswahl",
      title: "Maßgebliche Version",
      payload: {
        optionen: params.versionen.map((v) => `${v.label} (${v.datum})`),
      },
    }),
  ]);

// ---------------------- Thema-Merge ----------------------
export const buildThemaMergeSession = (params: {
  titelA: string;
  beschreibungA: string;
  titelB: string;
  beschreibungB: string;
  merge?: {
    candidateId: string;
    sourceTopicId: string;
    targetTopicId: string;
  };
}): DialogSession =>
  mkSession("Themen zusammenführen", `${params.titelA} ↔ ${params.titelB}`, [
    mkBox({
      type: "kontext",
      title: params.titelA,
      payload: { auszug: params.beschreibungA },
    }),
    mkBox({
      type: "kontext",
      title: params.titelB,
      payload: { auszug: params.beschreibungB },
    }),
    mkBox({
      type: "aktion",
      title: "Themen zusammenführen?",
      payload: {
        aktionen: ["Zusammenführen", "Getrennt lassen"],
        ...(params.merge
          ? {
              __submitIntent: {
                kind: "topic_merge" as const,
                candidateId: params.merge.candidateId,
                sourceTopicId: params.merge.sourceTopicId,
                targetTopicId: params.merge.targetTopicId,
              },
            }
          : {}),
      },
    }),
  ]);

// ---------------------- Rückfrage ----------------------
export const buildRueckfrageSession = (
  params: { frage: string; kontext?: string },
  projectId?: string | null,
): DialogSession =>
  mkSession("Rückfrage", params.frage, [
    mkBox({
      type: "kontext",
      title: "Rückfrage der Entität",
      payload: {
        auszug: params.frage,
        begruendung: params.kontext ?? "Diese Information wird für den Projektzustand benötigt.",
      },
    }),
    mkBox({
      type: "eingabe",
      title: "Antwort",
      payload: {
        placeholder: "Antwort eingeben…",
        intent: "rueckfrage",
        asks: "Antworten",
        __submitIntent: {
          kind: "intake_note" as const,
          projectId: projectId ?? null,
          contextHint: `Antwort auf Rückfrage: ${params.frage}`,
          sourceRef: { type: "rueckfrage", quelle: params.frage },
        },
      },
    }),
  ]);
