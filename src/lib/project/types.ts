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
  | "dependency"
  | "topic_merge";

export type DeltaTyp = "neu" | "ersetzt" | "bestaetigt" | "widersprochen" | "unclear";

export interface KonfliktFactRef {
  inhalt: string;
  datum: string;
  quelle: string;
  mode: "direkt" | "abgeleitet" | "extern";
}

export interface KonfliktEmpfehlung {
  gewinner: "A" | "B" | null;
  begruendung: string;
  konfidenz: number;
  tier: 1 | 2;
}

export interface KonfliktVM {
  id: string;
  typ: "deadline" | "decision" | "version" | "assignment";
  title: string;
  beschreibung: string;
  faktA: KonfliktFactRef;
  faktB: KonfliktFactRef;
  status: string;
  empfehlung: KonfliktEmpfehlung | null;
}

// =============================================================================
// Empfehlung — einheitlicher Vertrag für alle Drilldown-Objekte.
// Konflikt/Gap/Dependency/Entscheidung teilen sich die gleiche UI-Bühne im
// FaktDrillOverlay. `null` heißt „cogni hat keine ehrliche Empfehlung" → User
// sieht die heutige neutrale Bühne. Heuristik bleibt deterministisch
// (kein erfundenes KI-Signal), liegt in `src/lib/project/mappers/*`.
// =============================================================================
export type EmpfehlungKind = "konflikt" | "gap" | "dependency" | "entscheidung";
export type EmpfehlungKonfidenz = "hoch" | "mittel" | "niedrig";

export interface Empfehlung {
  kind: EmpfehlungKind;
  /** Zentrale Aussage, dominiert die Bühne. */
  vorschlag: string;
  /** Human Bausteine ("seit 12 Tagen offen · betrifft Frist Vertrag"). */
  begruendung: string;
  quelle?: string;
  konfidenz: EmpfehlungKonfidenz;
  /**
   * Was passiert bei „Übernehmen"?
   * - `accept`: direkter Commit (Konflikt: vorgewählte Seite).
   * - `submit_value`: Vorschlag landet als Antwort/Wert (Gap/Dependency).
   */
  intent: "accept" | "submit_value";
  /** Optionaler Payload-Override beim Commit. */
  payload?: Record<string, unknown>;
}

export interface GapVM {
  id: string;
  titel: string;
  wirkung: string;
  betrifft: string;
  lebensdauer: string;
  empfehlung?: Empfehlung | null;
}

export interface DependencyVM {
  id: string;
  typ: "blockiert_durch" | "wartet_auf" | "haengt_ab_von";
  quelle: string;
  ziel: string;
  beschreibung: string;
  empfehlung?: Empfehlung | null;
}

export interface TopicMergePayloadVM {
  candidateId: string;
  sourceTopicId: string;
  targetTopicId: string;
  titelA: string;
  beschreibungA: string;
  titelB: string;
  beschreibungB: string;
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
  /** Bei objektTyp='topic_merge' hängt der Render-Pfad daran. */
  topicMerge?: TopicMergePayloadVM;
  /** Bei objektTyp='konflikt': vollständiger KonfliktVM für Tier-Routing und Popover. */
  konfliktRef?: KonfliktVM;
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

export interface ThemaItemRef {
  id: string;
  kind: "entscheidung" | "offener_punkt";
  titel: string;
  beschreibung: string;
  status?: string;
}

export interface ThemaVM {
  id: string;
  name: string;
  beschreibung: string;
  entscheidungen: number;
  offenePunkte: number;
  dokumente: number;
  /** P1-F3: verknüpfte Items für Drilldown. Leer wenn topic ohne canonical_fact. */
  items: ThemaItemRef[];
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

export interface CoverageVM {
  knownFacts: number;
  openGaps: number;
  conflictsActive: number;
  lastIntakeAge: string;
}

export interface ProjectViewModel {
  id: string;
  name: string;
  status: string;
  description: string;
  lagetext: string;
  outcome: { erfolgskriterium: string; nogos: string[] } | null;
  stats: { letzteAenderung: string; naechsterTermin: string; budget: string };
  coverage: CoverageVM;
  konflikte: KonfliktVM[];
  gaps: GapVM[];
  dependencies: DependencyVM[];
  handlungsbedarf: HandlungsbedarfVM[];
  verlauf: VerlaufVM[];
  themen: ThemaVM[];
  dokumente: DokumentVM[];
  stakeholder: StakeholderVM[];
}
