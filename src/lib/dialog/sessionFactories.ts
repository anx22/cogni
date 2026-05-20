import type { DialogBox, DialogSession } from "./types";

let counter = 0;
const uid = (prefix = "b") => `${prefix}_${Date.now()}_${counter++}`;
const sessionId = () => `s_${Date.now()}_${counter++}`;

const mkBox = (b: Omit<DialogBox, "id" | "state"> & { state?: DialogBox["state"] }): DialogBox => ({
  id: uid(),
  state: b.state ?? "aufgeklappt",
  ...b,
});

// Generic Session-Builder — alle Factories teilen sich diesen Kern.
// `mode` ist optional: "readonly" für reine Inspektionsdialoge (kein Commit-Backend).
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
  mkSession("Konflikt klären", `Konflikt #${k.id}`, [
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
  mkSession("Lücke schließen", `Gap #${g.id}`, [
    mkBox({
      type: "gap",
      title: g.titel,
      payload: {
        wirkung: g.wirkung,
        lebensdauer: g.lebensdauer,
        betrifft: g.betrifft,
      },
    }),
  ]);

// ---------------------- Handlungsbedarf ----------------------
// Wissens-Box (Sachverhalt) + Eingabe-Box (Antwort). Solange das
// Antwort-Backend (note-create) noch fehlt, wird die Eingabe lokal akzeptiert
// und im UI als „vorgemerkt" markiert. Siehe NOW.md Backlog.
export const buildHandlungsbedarfSession = (item: {
  id: string;
  titel: string;
  beschreibung: string;
  quelle: string;
}): DialogSession =>
  mkSession("Handlungsbedarf", item.id, [
    mkBox({
      type: "wissen",
      title: item.titel,
      payload: { sachverhalt: item.beschreibung, quelle: item.quelle },
    }),
    mkBox({
      type: "eingabe",
      title: "Antwort",
      payload: {
        placeholder: "Antwort, Notiz oder Korrektur…",
        hinweis: "Wird vorgemerkt — Persistenz folgt mit der Antwort-Pipeline.",
      },
    }),
  ]);

// ---------------------- Thema ----------------------
// Reine Inspektion — keine Commit-Pfade.
export const buildThemaSession = (t: {
  id: string;
  name: string;
  beschreibung: string;
  entscheidungen: number;
  offenePunkte: number;
  dokumente: number;
}): DialogSession =>
  mkSession(
    "Thema",
    t.name,
    [
      mkBox({
        type: "kontext",
        title: t.name,
        payload: {
          auszug: t.beschreibung,
          begruendung: `${t.entscheidungen} Entscheidungen · ${t.offenePunkte} offen · ${t.dokumente} Dokumente`,
          quelle: `Thema #${t.id}`,
        },
      }),
    ],
    "readonly",
  );

// ---------------------- Dokument ----------------------
// Reine Inspektion — Preview & Versionshistorie sind geplant.
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
    `${d.typ.toUpperCase()} v${d.version}`,
    [
      mkBox({
        type: "kontext",
        title: d.name,
        payload: {
          auszug: `${d.typ.toUpperCase()} · Version ${d.version} · ${d.datum}${d.thema ? ` · Thema: ${d.thema}` : ""}`,
          hinweis: "Preview & Versionshistorie sind in Planung.",
          quelle: `Dokument #${d.id}`,
        },
      }),
    ],
    "readonly",
  );

// ---------------------- Verlauf ----------------------
// Reine Inspektion eines Verlaufseintrags.
export const buildVerlaufSession = (e: {
  id: string;
  inhalt: string;
  datum: string;
  quelle: string;
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
          quelle: e.quelle,
        },
      }),
    ],
    "readonly",
  );

// ---------------------- Feedback ----------------------
// Eingabe-Box ohne Backend-Anbindung — der Text wird lokal vorgemerkt.
// Persistenz folgt mit dem Feedback-Endpoint (siehe NOW.md Backlog).
export const buildFeedbackSession = (context: string): DialogSession =>
  mkSession("Feedback", context, [
    mkBox({
      type: "eingabe",
      title: "Was stimmt nicht oder fehlt?",
      payload: {
        placeholder: "Korrektur, Hinweis oder Frage…",
        hinweis: "Wird vorgemerkt — Persistenz folgt mit dem Feedback-Endpoint.",
      },
    }),
  ]);

// ---------------------- Source ----------------------
// Reine Inspektion. Volle Dokumenten-Preview ist geplant.
export const buildSourceSession = (quelle: string): DialogSession =>
  mkSession(
    "Quelle",
    quelle,
    [
      mkBox({
        type: "kontext",
        title: quelle,
        payload: {
          auszug: "Quellen-Vorschau in Planung.",
          hinweis: "Direkter Sprung in das Dokument folgt mit der Preview-Schicht.",
          quelle,
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
        quelle: params.titel,
      },
    }),
    mkBox({
      type: "zuordnung",
      title: params.titel,
      payload: { vorschlag: params.vorschlag },
    }),
  ]);

// ---------------------- Korrektur ----------------------
export const buildKorrekturSession = (params: {
  titel: string;
  aktuell: string;
  quelle: string;
}): DialogSession =>
  mkSession("Korrektur", params.titel, [
    mkBox({
      type: "kontext",
      title: "Aktueller Stand",
      payload: {
        auszug: params.aktuell,
        quelle: params.quelle,
        begruendung: "Diese Information soll korrigiert werden.",
      },
    }),
    mkBox({
      type: "eingabe",
      title: "Korrektur eingeben",
      payload: { placeholder: "Richtige Information…", intent: "korrektur" },
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
        quelle: params.quelle,
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
}): DialogSession =>
  mkSession("Thema zusammenführen", `${params.titelA} ↔ ${params.titelB}`, [
    mkBox({
      type: "kontext",
      title: params.titelA,
      payload: { auszug: params.beschreibungA, quelle: `Thema: ${params.titelA}` },
    }),
    mkBox({
      type: "kontext",
      title: params.titelB,
      payload: { auszug: params.beschreibungB, quelle: `Thema: ${params.titelB}` },
    }),
    mkBox({
      type: "aktion",
      title: "Themen zusammenführen?",
      payload: { aktionen: ["Zusammenführen", "Getrennt lassen"] },
    }),
  ]);

// ---------------------- Rückfrage ----------------------
export const buildRueckfrageSession = (params: {
  frage: string;
  kontext?: string;
}): DialogSession =>
  mkSession("Rückfrage", params.frage, [
    mkBox({
      type: "kontext",
      title: "Rückfrage der Entität",
      payload: {
        auszug: params.frage,
        begruendung: params.kontext ?? "Diese Information wird für den Projektzustand benötigt.",
        quelle: "System",
      },
    }),
    mkBox({
      type: "eingabe",
      title: "Antwort",
      payload: { placeholder: "Antwort eingeben…", intent: "rueckfrage" },
    }),
  ]);
