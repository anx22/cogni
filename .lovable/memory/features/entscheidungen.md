---
name: Entscheidungen
description: Graphiti gesetzt als Knowledge Graph, persistente AppSidebar (240px), CSS-Gradients für Entity, Vier-Rollen statt Bento-Tabs
type: feature
---

## Knowledge Graph: Graphiti
**Entschieden.** Graphiti wird als temporaler Knowledge Graph eingesetzt. Begründung: Fact Invalidation und temporale Beziehungen sind Kernfunktion.

## Persistente AppSidebar (240px)
**Revidiert 2026-05-18.** Frühere Regel „keine Sidebar" ist verworfen. AppSidebar ist auf Home und Projekt-Detail persistent (240px). Home: ohne Mini-Entity (Entity im Zentrum). Projekt-Detail: Mini-Entity oben (klick = zurück). Begründung: User-Test zeigte fehlende Projekt-Übersicht; Zustandswechsel allein reicht nicht. Siehe docs/design-implementation-plan.md Phase 3.

## Entity-Animation
CSS-Gradients mit Blur statt Canvas. Performant, wartbar, ausreichend für V1.

## Projekt-Screen-Architektur
**Vier-Rollen-Modell** (Lage, Handlungsbedarf, Verlauf, Substanz) statt gleichrangiger Bento-Kacheln oder Tab-Gruppierung. Die frühere 10-Facetten- und 3-Tab-Iteration ist verworfen.

## Navigation Entity ↔ Projekt
Zustandswechsel auf gleicher Seite, kein Routing. Entity schrumpft, Projekt gleitet herein.
