// Demo-Daten für den Projekt-Screen (Phase 3, UI-First)

export const demoProject = {
  id: "demo-1",
  name: "Redesign Kundenportal",
  status: "active",
  description: "Komplette Neugestaltung des B2B-Kundenportals mit Fokus auf Self-Service, Dashboards und automatisierte Reporting-Funktionen.",

  // Lagebild
  lagetext: "Das Projekt steht vor der finalen Designfreigabe. Zwei Konflikte blockieren die Migration der Bestandsdaten. Die Timeline wurde durch einen neuen Stakeholder-Wunsch um 2 Wochen verschoben. Drei Entscheidungen warten auf Bestätigung.",

  stats: {
    konflikte: 2,
    offenePunkte: 5,
    entscheidungenOffen: 3,
    themen: 8,
    dokumente: 14,
    stakeholder: 6,
    letzteAenderung: "vor 2 Stunden",
    naechsterTermin: "18. April 2026",
  },

  aenderungen: [
    { id: "a1", text: "Neuer Termin für Go-Live erkannt: 15. Mai 2026", delta: "replace", zeit: "vor 2 Stunden", quelle: "Mail von Thomas Berger" },
    { id: "a2", text: "Thema 'Datenmigration' um offenen Punkt ergänzt", delta: "add", zeit: "vor 5 Stunden", quelle: "Protokoll Steering Committee" },
    { id: "a3", text: "Entscheidung 'React statt Angular' bestätigt", delta: "confirm", zeit: "gestern", quelle: "Review Session #12" },
    { id: "a4", text: "Budgetrahmen von 180k auf 210k angepasst", delta: "replace", zeit: "gestern", quelle: "Mail von CFO" },
    { id: "a5", text: "Stakeholder Maria Schulz neu zugeordnet", delta: "add", zeit: "vor 2 Tagen", quelle: "Org-Update PPTX" },
  ],

  konflikte: [
    { id: "k1", typ: "deadline", title: "Go-Live Termin widersprüchlich", beschreibung: "Mail vom PM nennt 15. Mai, Steering-Protokoll sagt 1. Juni.", faktA: "Go-Live: 15. Mai 2026 (Mail Thomas Berger)", faktB: "Go-Live: 1. Juni 2026 (Protokoll Steering)", status: "offen" },
    { id: "k2", typ: "decision", title: "Migrationsstrategie unklar", beschreibung: "Zwei konkurrierende Ansätze: Big Bang vs. Phasenweise.", faktA: "Big-Bang-Migration empfohlen (Techteam)", faktB: "Phasenweise Migration gefordert (Fachseite)", status: "offen" },
  ],

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

  timeline: [
    { id: "tl1", datum: "15.04.2026", text: "Neuer Go-Live-Termin erkannt", typ: "change" },
    { id: "tl2", datum: "14.04.2026", text: "Budgetanpassung auf 210k bestätigt", typ: "confirm" },
    { id: "tl3", datum: "13.04.2026", text: "Maria Schulz als Stakeholder hinzugefügt", typ: "add" },
    { id: "tl4", datum: "12.04.2026", text: "Migrationsstrategie-Konflikt erkannt", typ: "conflict" },
    { id: "tl5", datum: "10.04.2026", text: "React-Entscheidung nach Review bestätigt", typ: "confirm" },
    { id: "tl6", datum: "08.04.2026", text: "UX-Prototyp v2 hochgeladen", typ: "add" },
    { id: "tl7", datum: "05.04.2026", text: "Steering Committee Protokoll verarbeitet", typ: "add" },
  ],

  entscheidungen: [
    { id: "e1", title: "Frontend-Framework: React", status: "active", entschiedenAm: "10.04.2026", quelle: "Review Session #12", angriffspunkt: null },
    { id: "e2", title: "Hosting auf AWS", status: "active", entschiedenAm: "02.04.2026", quelle: "Techteam-Empfehlung", angriffspunkt: null },
    { id: "e3", title: "Go-Live Termin", status: "draft", entschiedenAm: null, quelle: null, angriffspunkt: "Widersprüchliche Angaben" },
    { id: "e4", title: "Migrationsstrategie", status: "draft", entschiedenAm: null, quelle: null, angriffspunkt: "Zwei konkurrierende Vorschläge" },
    { id: "e5", title: "Budget 210k EUR", status: "active", entschiedenAm: "14.04.2026", quelle: "CFO-Freigabe", angriffspunkt: null },
  ],

  offenePunkte: [
    { id: "op1", title: "Datenmapping für Altdaten klären", status: "open", projekt: "Datenmigration" },
    { id: "op2", title: "Performance-Anforderungen definieren", status: "open", projekt: "API-Integration" },
    { id: "op3", title: "Mobile-First oder Desktop-First?", status: "open", projekt: "UX Design" },
    { id: "op4", title: "Reporting-Frequenz abstimmen", status: "open", projekt: "Reporting" },
    { id: "op5", title: "Validierungsregeln für Import", status: "open", projekt: "Datenmigration" },
  ],

  aufgaben: [
    { id: "au1", title: "Wireframes finalisieren", status: "in_progress", zugewiesen: "Lisa Meier", faellig: "20.04.2026" },
    { id: "au2", title: "API-Dokumentation erstellen", status: "open", zugewiesen: "Jan Krüger", faellig: "25.04.2026" },
    { id: "au3", title: "Testdaten generieren", status: "open", zugewiesen: null, faellig: null },
  ],

  dokumente: [
    { id: "d1", name: "Steering Committee Protokoll v3", typ: "docx", version: 3, datum: "12.04.2026", thema: "Go-Live" },
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

  feedback: [
    { id: "f1", inhalt: "UX-Prototyp braucht stärkere Call-to-Actions", ziel: "UX-Prototyp Kundenportal", autor: "Dr. Anna Weber", datum: "11.04.2026" },
    { id: "f2", inhalt: "Datenmigration sollte in 3 Phasen erfolgen", ziel: "Migrationsstrategie", autor: "Jan Krüger", datum: "13.04.2026" },
    { id: "f3", inhalt: "Reporting muss auch PDF-Export unterstützen", ziel: "Reporting", autor: "Thomas Berger", datum: "09.04.2026" },
  ],

  korrekturen: [
    { id: "c1", text: "Budgetrahmen korrigiert: 180k → 210k", vorher: "180.000 EUR", nachher: "210.000 EUR", datum: "14.04.2026" },
  ],
};
