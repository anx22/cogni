// Demo-Daten für den Projekt-Screen (Phase 3.5, Vier-Rollen-Modell)

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

export const demoProject = {
  id: "demo-1",
  name: "Redesign Kundenportal",
  status: "active",
  description:
    "Komplette Neugestaltung des B2B-Kundenportals mit Fokus auf Self-Service, Dashboards und automatisierte Reporting-Funktionen.",

  lagetext:
    "Das Projekt steht vor der finalen Designfreigabe. Zwei Konflikte blockieren die Migration der Bestandsdaten. Die Timeline wurde durch einen neuen Stakeholder-Wunsch um 2 Wochen verschoben. Drei Entscheidungen warten auf Bestätigung.",

  outcome: {
    erfolgskriterium:
      "Self-Service-Quote von 70% innerhalb 3 Monaten nach Go-Live, Reporting-Latenz < 2s.",
    nogos: [
      "Kein Daten-Verlust bei Migration",
      "Keine Funktionsregression gegenüber Altportal",
    ],
  },

  stats: {
    letzteAenderung: "vor 2 Stunden",
    naechsterTermin: "18. April 2026",
    budget: "210.000 EUR",
  },

  konflikte: [
    {
      id: "k1",
      typ: "deadline" as const,
      title: "Go-Live Termin widersprüchlich",
      beschreibung: "Mail vom PM nennt 15. Mai, Steering-Protokoll sagt 1. Juni.",
      faktA: "Go-Live: 15. Mai 2026 (Mail Thomas Berger)",
      faktB: "Go-Live: 1. Juni 2026 (Protokoll Steering)",
      status: "offen",
    },
    {
      id: "k2",
      typ: "decision" as const,
      title: "Migrationsstrategie unklar",
      beschreibung: "Zwei konkurrierende Ansätze: Big Bang vs. Phasenweise.",
      faktA: "Big-Bang-Migration empfohlen (Techteam)",
      faktB: "Phasenweise Migration gefordert (Fachseite)",
      status: "offen",
    },
  ],

  // Gap Signals — fehlende Information mit Wirkung
  gaps: [
    {
      id: "g1",
      titel: "Performance-Anforderung fehlt",
      wirkung: "Architekturentscheidung Caching/CDN nicht treffbar",
      betrifft: "API-Integration, Reporting",
      lebensdauer: "seit 6 Tagen offen",
    },
    {
      id: "g2",
      titel: "Migrations-Cutoff unklar",
      wirkung: "Test-Strategie und Fallback-Plan blockiert",
      betrifft: "Datenmigration",
      lebensdauer: "seit 3 Tagen offen",
    },
    {
      id: "g3",
      titel: "DSGVO-Auftragsverarbeitung mit Agentur ungeklärt",
      wirkung: "Vertragsabschluss verzögert sich",
      betrifft: "Rechtliches",
      lebensdauer: "seit 9 Tagen offen",
    },
  ],

  // Dependency Signals
  dependencies: [
    {
      id: "dep1",
      typ: "blockiert_durch" as const,
      quelle: "Datenmigration",
      ziel: "Konflikt: Migrationsstrategie",
      beschreibung: "Migration kann nicht starten, bevor Strategie steht.",
    },
    {
      id: "dep2",
      typ: "wartet_auf" as const,
      quelle: "API-Architektur",
      ziel: "Performance-Anforderung",
      beschreibung: "Caching-Layer hängt an Latenzziel.",
    },
    {
      id: "dep3",
      typ: "haengt_ab_von" as const,
      quelle: "Go-Live",
      ziel: "Schulungstermine Endnutzer",
      beschreibung: "Rollout setzt geschulte Power-User voraus.",
    },
  ],

  // Handlungsbedarf — normalisierte ActionItems mit Arbeitsmodus
  handlungsbedarf: [
    {
      id: "h1",
      arbeitsmodus: "entscheiden" as Arbeitsmodus,
      objektTyp: "konflikt" as ObjektTyp,
      titel: "Go-Live Termin festlegen",
      beschreibung: "15. Mai vs. 1. Juni — Klärung mit Steering nötig.",
      verantwortlich: "Thomas Berger",
      frist: "20.04.2026",
      quelle: "Konflikt #k1",
      blocker: true,
    },
    {
      id: "h2",
      arbeitsmodus: "entscheiden" as Arbeitsmodus,
      objektTyp: "konflikt" as ObjektTyp,
      titel: "Migrationsstrategie wählen",
      beschreibung: "Big-Bang vs. phasenweise — beide Optionen geprüft.",
      verantwortlich: "Jan Krüger",
      frist: "22.04.2026",
      quelle: "Konflikt #k2",
      blocker: true,
    },
    {
      id: "h3",
      arbeitsmodus: "klaeren" as Arbeitsmodus,
      objektTyp: "gap" as ObjektTyp,
      titel: "Performance-Anforderung definieren",
      beschreibung: "Latenzziel und Concurrent-User-Zahl fehlen.",
      verantwortlich: "Dr. Anna Weber",
      frist: null,
      quelle: "Gap #g1",
      blocker: false,
    },
    {
      id: "h4",
      arbeitsmodus: "klaeren" as Arbeitsmodus,
      objektTyp: "gap" as ObjektTyp,
      titel: "Migrations-Cutoff bestimmen",
      beschreibung: "Stichtag für Altdatenstand festlegen.",
      verantwortlich: null,
      frist: "25.04.2026",
      quelle: "Gap #g2",
      blocker: false,
    },
    {
      id: "h5",
      arbeitsmodus: "klaeren" as Arbeitsmodus,
      objektTyp: "offener_punkt" as ObjektTyp,
      titel: "Mobile-First oder Desktop-First?",
      beschreibung: "UX-Richtung mit Fachseite abstimmen.",
      verantwortlich: "Lisa Meier",
      frist: null,
      quelle: "Manuell ergänzt im Review",
      blocker: false,
      manuell: true,
    },
    {
      id: "h6",
      arbeitsmodus: "umsetzen" as Arbeitsmodus,
      objektTyp: "aufgabe" as ObjektTyp,
      titel: "Wireframes finalisieren",
      beschreibung: "Letzte Iteration nach Feedback Steering.",
      verantwortlich: "Lisa Meier",
      frist: "20.04.2026",
      quelle: "UX Design",
      blocker: false,
    },
    {
      id: "h7",
      arbeitsmodus: "umsetzen" as Arbeitsmodus,
      objektTyp: "aufgabe" as ObjektTyp,
      titel: "API-Dokumentation erstellen",
      beschreibung: "OpenAPI-Spec für externe Partner.",
      verantwortlich: "Jan Krüger",
      frist: "25.04.2026",
      quelle: "API-Integration",
      blocker: false,
    },
    {
      id: "h8",
      arbeitsmodus: "pruefen" as Arbeitsmodus,
      objektTyp: "feedback" as ObjektTyp,
      titel: "CTA-Stärke im UX-Prototyp prüfen",
      beschreibung: "Feedback Dr. Weber: Call-to-Actions zu schwach.",
      verantwortlich: "Lisa Meier",
      frist: null,
      quelle: "Feedback Dr. Weber",
      blocker: false,
    },
    {
      id: "h9",
      arbeitsmodus: "pruefen" as Arbeitsmodus,
      objektTyp: "feedback" as ObjektTyp,
      titel: "PDF-Export für Reporting verifizieren",
      beschreibung: "Anforderung aus Mail Berger 09.04.",
      verantwortlich: null,
      frist: null,
      quelle: "Feedback Berger",
      blocker: false,
    },
    {
      id: "h10",
      arbeitsmodus: "klaeren" as Arbeitsmodus,
      objektTyp: "dependency" as ObjektTyp,
      titel: "Migration blockiert durch Strategie-Konflikt",
      beschreibung: "Datenmigration kann nicht starten, bevor Big-Bang vs. Phasenweise entschieden ist.",
      verantwortlich: "Jan Krüger",
      frist: null,
      quelle: "Dependency #dep1",
      blocker: true,
    },
    {
      id: "h11",
      arbeitsmodus: "pruefen" as Arbeitsmodus,
      objektTyp: "dependency" as ObjektTyp,
      titel: "Schulungstermine als Voraussetzung für Go-Live klären",
      beschreibung: "Rollout setzt geschulte Power-User voraus — Termine fehlen.",
      verantwortlich: null,
      frist: null,
      quelle: "Dependency #dep3",
      blocker: false,
    },
    {
      id: "h12",
      arbeitsmodus: "klaeren" as Arbeitsmodus,
      objektTyp: "gap" as ObjektTyp,
      titel: "DSGVO-Auftragsverarbeitung mit Agentur klären",
      beschreibung: "Vertragsabschluss mit Agentur Digitalis verzögert sich, AVV fehlt.",
      verantwortlich: null,
      frist: null,
      quelle: "Gap #g3",
      blocker: false,
    },
    {
      id: "h13",
      arbeitsmodus: "klaeren" as Arbeitsmodus,
      objektTyp: "dependency" as ObjektTyp,
      titel: "API-Architektur wartet auf Performance-Anforderung",
      beschreibung: "Caching-Layer-Design hängt am noch fehlenden Latenzziel.",
      verantwortlich: "Jan Krüger",
      frist: null,
      quelle: "Dependency #dep2",
      blocker: false,
    },
  ],

  // Verlauf — chronologischer Ereignisfeed mit Delta-Tags
  verlauf: [
    {
      id: "v1",
      datum: "15.04.2026",
      delta: "neu" as DeltaTyp,
      ereignisTyp: "aenderung" as const,
      inhalt: "Neuer Go-Live-Termin erkannt: 15. Mai 2026",
      objekt: "Termin",
      quelle: "Mail von Thomas Berger",
    },
    {
      id: "v2",
      datum: "14.04.2026",
      delta: "bestaetigt" as DeltaTyp,
      ereignisTyp: "entscheidung" as const,
      inhalt: "Budget 210k EUR bestätigt",
      objekt: "Entscheidung",
      quelle: "CFO-Freigabe",
    },
    {
      id: "v3",
      datum: "13.04.2026",
      delta: "neu" as DeltaTyp,
      ereignisTyp: "aenderung" as const,
      inhalt: "Maria Schulz als Stakeholder hinzugefügt",
      objekt: "Stakeholder",
      quelle: "Org-Update PPTX",
    },
    {
      id: "v4",
      datum: "12.04.2026",
      delta: "widersprochen" as DeltaTyp,
      ereignisTyp: "konflikt" as const,
      inhalt: "Migrationsstrategie-Konflikt erkannt",
      objekt: "Konflikt",
      quelle: "Steering Committee Protokoll",
    },
    {
      id: "v5",
      datum: "12.04.2026",
      delta: "neu" as DeltaTyp,
      ereignisTyp: "upload" as const,
      inhalt: "Steering Committee Protokoll v3 hochgeladen",
      objekt: "Dokument",
      quelle: "Dokument-Upload",
    },
    {
      id: "v6",
      datum: "10.04.2026",
      delta: "bestaetigt" as DeltaTyp,
      ereignisTyp: "entscheidung" as const,
      inhalt: "React als Frontend-Framework bestätigt",
      objekt: "Entscheidung",
      quelle: "Review Session #12",
    },
    {
      id: "v7",
      datum: "08.04.2026",
      delta: "ersetzt" as DeltaTyp,
      ereignisTyp: "upload" as const,
      inhalt: "UX-Prototyp v2 ersetzt v1",
      objekt: "Dokument",
      quelle: "Lisa Meier",
    },
    {
      id: "v8",
      datum: "05.04.2026",
      delta: "neu" as DeltaTyp,
      ereignisTyp: "milestone" as const,
      inhalt: "Konzeptphase abgeschlossen",
      objekt: "Milestone",
      quelle: "Projektplan",
    },
    {
      id: "v9",
      datum: "02.04.2026",
      delta: "bestaetigt" as DeltaTyp,
      ereignisTyp: "entscheidung" as const,
      inhalt: "Hosting auf AWS bestätigt",
      objekt: "Entscheidung",
      quelle: "Techteam-Empfehlung",
    },
  ],

  // Substanz — Themen mit Drilldown-Counts
  themen: [
    { id: "t1", name: "UX Design", beschreibung: "Wireframes, Prototypen, Usability-Tests", entscheidungen: 2, offenePunkte: 1, dokumente: 4 },
    { id: "t2", name: "Datenmigration", beschreibung: "Bestandsdaten, Mapping, Validierung", entscheidungen: 1, offenePunkte: 2, dokumente: 3 },
    { id: "t3", name: "API-Integration", beschreibung: "REST-Schnittstellen, Auth, Rate Limiting", entscheidungen: 1, offenePunkte: 1, dokumente: 2 },
    { id: "t4", name: "Reporting", beschreibung: "Dashboards, Exportfunktionen, Zeitreihen", entscheidungen: 0, offenePunkte: 1, dokumente: 2 },
    { id: "t5", name: "Infrastruktur", beschreibung: "Hosting, CI/CD, Monitoring", entscheidungen: 1, offenePunkte: 0, dokumente: 1 },
    { id: "t6", name: "Rechtliches", beschreibung: "DSGVO, Impressum, Cookie-Consent", entscheidungen: 0, offenePunkte: 0, dokumente: 1 },
    { id: "t7", name: "Schulung", beschreibung: "Endnutzer-Trainings, Dokumentation", entscheidungen: 0, offenePunkte: 0, dokumente: 1 },
    { id: "t8", name: "Go-Live", beschreibung: "Rollout-Plan, Kommunikation, Fallback", entscheidungen: 1, offenePunkte: 0, dokumente: 0 },
  ],

  dokumente: [
    { id: "d1", name: "Steering Committee Protokoll", typ: "docx", version: 3, datum: "12.04.2026", thema: "Go-Live" },
    { id: "d2", name: "UX-Prototyp Kundenportal", typ: "pptx", version: 2, datum: "08.04.2026", thema: "UX Design" },
    { id: "d3", name: "Migrationsstrategie Vergleich", typ: "pdf", version: 1, datum: "10.04.2026", thema: "Datenmigration" },
    { id: "d4", name: "API-Schnittstellenspezifikation", typ: "pdf", version: 1, datum: "05.04.2026", thema: "API-Integration" },
    { id: "d5", name: "Budget-Freigabe CFO", typ: "eml", version: 1, datum: "14.04.2026", thema: null },
  ],

  stakeholder: [
    { id: "s1", name: "Thomas Berger", rolle: "Projektleiter", org: "Interne IT" },
    { id: "s2", name: "Lisa Meier", rolle: "UX Lead", org: "Design Abteilung" },
    { id: "s3", name: "Jan Krüger", rolle: "Tech Lead", org: "Interne IT" },
    { id: "s4", name: "Dr. Anna Weber", rolle: "Fachbereich", org: "Vertrieb" },
    { id: "s5", name: "Maria Schulz", rolle: "Projektsteuerung", org: "PMO" },
    { id: "s6", name: "Ext. Partner", rolle: "Implementierung", org: "Agentur Digitalis" },
  ],
};
