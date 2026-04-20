export type BoxType =
  | "wissen"
  | "zuordnung"
  | "konflikt"
  | "gap"
  | "auswahl"
  | "eingabe"
  | "kontext"
  | "aktion";

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
}

export const END_STATES: BoxState[] = ["bestaetigt", "verworfen", "eskaliert"];
