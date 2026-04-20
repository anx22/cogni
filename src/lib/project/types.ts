// Zentrales ViewModel — entspricht dem bisherigen demoProject-Shape,
// damit die UI-Komponenten unverändert weiter funktionieren.

export type Arbeitsmodus = "entscheiden" | "klaeren" | "umsetzen" | "pruefen";
export type ObjektTyp =
  | "termin"
  | "entscheidung"
  | "konflikt"
  | "dokument"
  | "thema"
  | "gap"
  | "blocker"
  | "aufgabe"
  | "offener_punkt"
  | "feedback"
  | "dependency";

export type DeltaTyp = "neu" | "ersetzt" | "bestaetigt" | "widersprochen";

export interface KonfliktVM {
  id: string;
  typ: "deadline" | "decision" | "version" | "assignment";
  title: string;
  beschreibung: string;
  faktA: string;
  faktB: string;
  status: string;
}

export interface GapVM {
  id: string;
  titel: string;
  wirkung: string;
  betrifft: string;
  lebensdauer: string;
}

export interface DependencyVM {
  id: string;
  typ: "blockiert_durch" | "wartet_auf" | "haengt_ab_von";
  quelle: string;
  ziel: string;
  beschreibung: string;
}

export interface HandlungsbedarfVM {
  id: string;
  arbeitsmodus: Arbeitsmodus;
  objektTyp: ObjektTyp;
  titel: string;
  beschreibung: string;
  verantwortlich: string | null;
  frist: string | null;
  quelle: string;
  blocker: boolean;
  manuell?: boolean;
}

export interface VerlaufVM {
  id: string;
  datum: string;
  delta: DeltaTyp;
  ereignisTyp: "aenderung" | "entscheidung" | "konflikt" | "upload" | "milestone";
  inhalt: string;
  objekt: string;
  quelle: string;
  manuell?: boolean;
}

export interface ThemaVM {
  id: string;
  name: string;
  beschreibung: string;
  entscheidungen: number;
  offenePunkte: number;
  dokumente: number;
}

export interface DokumentVM {
  id: string;
  name: string;
  typ: string;
  version: number;
  datum: string;
  thema: string | null;
}

export interface StakeholderVM {
  id: string;
  name: string;
  rolle: string;
  org: string;
}

export interface ProjectViewModel {
  id: string;
  name: string;
  status: string;
  description: string;
  lagetext: string;
  outcome: { erfolgskriterium: string; nogos: string[] } | null;
  stats: { letzteAenderung: string; naechsterTermin: string; budget: string };
  konflikte: KonfliktVM[];
  gaps: GapVM[];
  dependencies: DependencyVM[];
  handlungsbedarf: HandlungsbedarfVM[];
  verlauf: VerlaufVM[];
  themen: ThemaVM[];
  dokumente: DokumentVM[];
  stakeholder: StakeholderVM[];
}
