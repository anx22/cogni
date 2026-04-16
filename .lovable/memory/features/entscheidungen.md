---
name: Entscheidungen
description: Graphiti gesetzt als Knowledge Graph, keine Sidebar, CSS-Gradients für Entity, Vier-Rollen statt Bento-Tabs
type: feature
---

## Knowledge Graph: Graphiti
**Entschieden.** Graphiti wird als temporaler Knowledge Graph eingesetzt. Begründung: Fact Invalidation und temporale Beziehungen sind Kernfunktion. (Hinweis: v2-Input listet die Entscheidung als offen, der Nutzer hat sie aber bestätigt — Graphiti ist gesetzt.)

## Keine klassische Sidebar
Orientierung läuft über Zustandswechsel zwischen Entität, Projekt und Overlay.

## Entity-Animation
CSS-Gradients mit Blur statt Canvas. Performant, wartbar, ausreichend für V1.

## Projekt-Screen-Architektur
**Vier-Rollen-Modell** (Lage, Handlungsbedarf, Verlauf, Substanz) statt gleichrangiger Bento-Kacheln oder Tab-Gruppierung. Die frühere 10-Facetten- und 3-Tab-Iteration ist verworfen.

## Navigation Entity ↔ Projekt
Zustandswechsel auf gleicher Seite, kein Routing. Entity schrumpft, Projekt gleitet herein.
