// =============================================================================
//  Dialog-Typen — Sprechhandlungen statt Inhaltstypen.
// -----------------------------------------------------------------------------
//  Box-Typen sind die UI-Übersetzung der `modality`, die die Verstehens-Pipeline
//  ausliefert. Jede Modalität hat in der Renderer-Matrix (ReviewRow.tsx) eine
//  eigene Default-Aktion und Aktionsleiste. Eingabefelder gibt es NUR, wenn die
//  KI explizit ein `asks` setzt — sonst keine "Wert eingeben"-Sackgasse.
//
//  Siehe docs/DECISIONS.md (Modalitäts-Vertrag) und mem://features/modality-matrix.
// =============================================================================

export type BoxType =
  // Klassisch (Inhalt + Steuerung)
  | "wissen" // assertion
  | "zuordnung" // Projekt-Gate
  | "konflikt" // widersprüchlich
  | "gap" // Lücke mit Eingabe
  | "auswahl" // selection
  | "eingabe" // input
  | "kontext" // context
  | "aktion" // action
  // Sprechhandlungen (neu, siehe DECISIONS modality-matrix)
  | "bedingung" // condition — qualifiziert anderen Fakt
  | "ausschluss" // exclusion — "nicht enthalten"
  | "annahme" // assumption — Hypothese
  | "vorschlag" // suggestion — Option, noch nicht entschieden
  | "frage" // question — echte Frage an User (mit asks)
  | "notiz" // note — informativ, kein Pflicht-Click
  | "beziehung" // relation — Kante zwischen Entitäten
  | "attribut" // attribute — Update an Bezugsobjekt
  | "risiko" // risk — Warnung
  | "unklar"; // unclear — KI weiß nicht, fragt User um Klassifikation

export type BoxState =
  | "vorgeschlagen"
  | "aufgeklappt"
  | "geaendert"
  | "bestaetigt"
  | "verworfen"
  | "eskaliert";

export interface DialogBox {
  id: string;
  type: BoxType;
  state: BoxState;
  title: string;
  payload: any;
}

export type DialogMode = "edit" | "readonly";

export interface DialogSession {
  id: string;
  anlass: string;
  context?: string;
  boxes: DialogBox[];
  mode?: DialogMode;
  closedAt?: string | null;
  projectId?: string | null;
  projectName?: string | null;
}

export const END_STATES: BoxState[] = ["bestaetigt", "verworfen", "eskaliert"];
