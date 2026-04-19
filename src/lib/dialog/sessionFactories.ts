import type { DialogBox, DialogSession } from "./types";

let counter = 0;
const uid = (prefix = "b") => `${prefix}_${Date.now()}_${counter++}`;

const sessionId = () => `s_${Date.now()}_${counter++}`;

const mkBox = (b: Omit<DialogBox, "id" | "state"> & { state?: DialogBox["state"] }): DialogBox => ({
  id: uid(),
  state: b.state ?? "aufgeklappt",
  ...b,
});

// ---------------------- Konflikt ----------------------
export const buildKonfliktSession = (k: {
  id: string;
  title: string;
  beschreibung: string;
  faktA: string;
  faktB: string;
}): DialogSession => ({
  id: sessionId(),
  anlass: "Konflikt klären",
  context: `Konflikt #${k.id}`,
  boxes: [
    mkBox({
      type: "konflikt",
      title: k.title,
      payload: {
        beschreibung: k.beschreibung,
        faktA: k.faktA,
        faktB: k.faktB,
      },
    }),
    mkBox({
      type: "kontext",
      title: "Hintergrund",
      state: "vorgeschlagen",
      payload: {
        auszug: k.beschreibung,
        quelle: `Konflikt #${k.id}`,
        begruendung: "Beide Fakten stammen aus unterschiedlichen Quellen.",
      },
    }),
    mkBox({
      type: "aktion",
      title: "Entscheidung übernehmen",
      payload: {},
    }),
  ],
});

// ---------------------- Gap ----------------------
export const buildGapSession = (g: {
  id: string;
  titel: string;
  wirkung: string;
  betrifft: string;
  lebensdauer: string;
}): DialogSession => ({
  id: sessionId(),
  anlass: "Lücke schließen",
  context: `Gap #${g.id}`,
  boxes: [
    mkBox({
      type: "gap",
      title: g.titel,
      payload: {
        wirkung: g.wirkung,
        lebensdauer: g.lebensdauer,
      },
    }),
    mkBox({
      type: "eingabe",
      title: "Begründung / Quelle",
      state: "vorgeschlagen",
      payload: { placeholder: "Woher stammt die Information?", hinweis: `Betrifft: ${g.betrifft}` },
    }),
    mkBox({ type: "aktion", title: "Lücke abschließen", payload: {} }),
  ],
});

// ---------------------- Handlungsbedarf ----------------------
export const buildHandlungsbedarfSession = (item: {
  id: string;
  titel: string;
  beschreibung: string;
  quelle: string;
}): DialogSession => ({
  id: sessionId(),
  anlass: "Handlungsbedarf bearbeiten",
  context: item.id,
  boxes: [
    mkBox({
      type: "wissen",
      title: item.titel,
      payload: { sachverhalt: item.beschreibung, quelle: item.quelle },
    }),
    mkBox({
      type: "eingabe",
      title: "Antwort / Bearbeitung",
      state: "vorgeschlagen",
      payload: { placeholder: "Antwort, Notiz oder Korrektur…" },
    }),
    mkBox({ type: "aktion", title: "Bearbeitung übernehmen", payload: {} }),
  ],
});

// ---------------------- Thema ----------------------
export const buildThemaSession = (t: {
  id: string;
  name: string;
  beschreibung: string;
  entscheidungen: number;
  offenePunkte: number;
  dokumente: number;
}): DialogSession => ({
  id: sessionId(),
  anlass: "Thema öffnen",
  context: t.name,
  boxes: [
    mkBox({
      type: "kontext",
      title: t.name,
      payload: {
        auszug: t.beschreibung,
        begruendung: `${t.entscheidungen} Entscheidungen · ${t.offenePunkte} offen · ${t.dokumente} Dokumente`,
        quelle: `Thema #${t.id}`,
      },
    }),
    mkBox({
      type: "zuordnung",
      title: "Inhalt diesem Thema zuordnen?",
      state: "vorgeschlagen",
      payload: {
        frage: "Sollen neue Erkenntnisse automatisch hier landen?",
        optionen: ["Ja, automatisch", "Nur mit Bestätigung", "Nein"],
      },
    }),
  ],
});

// ---------------------- Dokument ----------------------
export const buildDokumentSession = (d: {
  id: string;
  name: string;
  typ: string;
  version: number;
  datum: string;
  thema?: string | null;
}): DialogSession => ({
  id: sessionId(),
  anlass: "Dokument öffnen",
  context: `${d.typ.toUpperCase()} v${d.version}`,
  boxes: [
    mkBox({
      type: "kontext",
      title: d.name,
      payload: {
        auszug: `${d.typ.toUpperCase()} · Version ${d.version} · ${d.datum}${d.thema ? ` · Thema: ${d.thema}` : ""}`,
        begruendung: "Preview & Versionshistorie folgen in Phase 6.",
        quelle: `Dokument #${d.id}`,
      },
    }),
  ],
});

// ---------------------- Verlauf ----------------------
export const buildVerlaufSession = (e: {
  id: string;
  inhalt: string;
  datum: string;
  quelle: string;
  delta: string;
  ereignisTyp: string;
}): DialogSession => {
  const isConflict = e.ereignisTyp === "konflikt" || e.delta === "widersprochen";
  return {
    id: sessionId(),
    anlass: isConflict ? "Verlaufseintrag · Konflikt" : "Verlaufseintrag",
    context: e.datum,
    boxes: [
      mkBox({
        type: "kontext",
        title: e.inhalt,
        payload: {
          auszug: `${e.delta.toUpperCase()} · ${e.datum}`,
          quelle: e.quelle,
          begruendung: "Originalereignis aus dem Projektverlauf.",
        },
      }),
      ...(isConflict
        ? [
            mkBox({
              type: "konflikt" as const,
              title: "Verknüpfter Konflikt",
              state: "vorgeschlagen" as const,
              payload: {
                beschreibung: e.inhalt,
                faktA: "Variante A (siehe Konfliktliste)",
                faktB: "Variante B (siehe Konfliktliste)",
              },
            }),
          ]
        : []),
    ],
  };
};

// ---------------------- Feedback ----------------------
export const buildFeedbackSession = (context: string): DialogSession => ({
  id: sessionId(),
  anlass: "Feedback / Korrektur",
  context,
  boxes: [
    mkBox({
      type: "eingabe",
      title: "Was stimmt nicht oder fehlt?",
      payload: { placeholder: "Korrektur, Hinweis oder Frage…" },
    }),
    mkBox({ type: "aktion", title: "Feedback abschicken", payload: {} }),
  ],
});

// ---------------------- Source ----------------------
export const buildSourceSession = (quelle: string): DialogSession => ({
  id: sessionId(),
  anlass: "Quelle ansehen",
  context: quelle,
  boxes: [
    mkBox({
      type: "kontext",
      title: quelle,
      payload: {
        auszug: "Quellen-Vorschau folgt mit Phase 6 (Dokumenten-Preview).",
        quelle,
      },
    }),
  ],
});
