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
const mkSession = (anlass: string, context: string, boxes: DialogBox[]): DialogSession => ({
  id: sessionId(),
  anlass,
  context,
  boxes,
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
      payload: { placeholder: "Antwort, Notiz oder Korrektur…" },
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
}): DialogSession =>
  mkSession("Thema", t.name, [
    mkBox({
      type: "kontext",
      title: t.name,
      payload: {
        auszug: t.beschreibung,
        begruendung: `${t.entscheidungen} Entscheidungen · ${t.offenePunkte} offen · ${t.dokumente} Dokumente`,
        quelle: `Thema #${t.id}`,
      },
    }),
  ]);

// ---------------------- Dokument ----------------------
export const buildDokumentSession = (d: {
  id: string;
  name: string;
  typ: string;
  version: number;
  datum: string;
  thema?: string | null;
}): DialogSession =>
  mkSession("Dokument", `${d.typ.toUpperCase()} v${d.version}`, [
    mkBox({
      type: "kontext",
      title: d.name,
      payload: {
        auszug: `${d.typ.toUpperCase()} · Version ${d.version} · ${d.datum}${d.thema ? ` · Thema: ${d.thema}` : ""}`,
        begruendung: "Preview & Versionshistorie folgen in Phase 6.",
        quelle: `Dokument #${d.id}`,
      },
    }),
  ]);

// ---------------------- Verlauf ----------------------
export const buildVerlaufSession = (e: {
  id: string;
  inhalt: string;
  datum: string;
  quelle: string;
  delta: string;
  ereignisTyp: string;
}): DialogSession =>
  mkSession("Verlaufseintrag", e.datum, [
    mkBox({
      type: "kontext",
      title: e.inhalt,
      payload: {
        auszug: `${e.delta.toUpperCase()} · ${e.datum}`,
        quelle: e.quelle,
        begruendung: "Originalereignis aus dem Projektverlauf.",
      },
    }),
  ]);

// ---------------------- Feedback ----------------------
export const buildFeedbackSession = (context: string): DialogSession =>
  mkSession("Feedback", context, [
    mkBox({
      type: "eingabe",
      title: "Was stimmt nicht oder fehlt?",
      payload: { placeholder: "Korrektur, Hinweis oder Frage…" },
    }),
  ]);

// ---------------------- Source ----------------------
export const buildSourceSession = (quelle: string): DialogSession =>
  mkSession("Quelle", quelle, [
    mkBox({
      type: "kontext",
      title: quelle,
      payload: {
        auszug: "Quellen-Vorschau folgt mit Phase 6 (Dokumenten-Preview).",
        quelle,
      },
    }),
  ]);
