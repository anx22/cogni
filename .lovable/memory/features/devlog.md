---
name: devlog
description: Dev-only Transparenz-Layer. Singleton-Logger mit Kategorien (intake/db/edge/realtime/auth/ui/error), Ringbuffer 500, UI-Panel bottom-right. Inaktiv in Production. Erweiterbar via addSink().
type: feature
---

# DevLog — Transparenz-Layer (dev-only)

## Zweck

Jeder Vorgang sichtbar machen: Frontend-Aktionen, DB-Inserts, Edge-Calls, Realtime-Events, Fehler. Ein Ort, kein console.log-Chaos.

## Architektur

- **`src/lib/devlog/devlog.ts`** — Singleton `devlog`. API: `devlog.intake/db/edge/realtime/auth/ui/error/warn(msg, payload?)`. Ringbuffer 500. Spiegel auf `console.debug`. `attachGlobalErrorHandlers()` fängt `window.error` + `unhandledrejection`. Dev-only: in Production sind alle Calls No-Op.
- **`src/lib/devlog/useDevLog.ts`** — `useSyncExternalStore`-Hook für Reaktivität.
- **`src/components/devlog/DevLogPanel.tsx`** — Fixed bottom-right Badge → Drawer mit Filter-Pills, Pause, Copy-as-JSON, Clear, Payload-Aufklappen.

## Erweiterung

- **Neue Kategorie**: in `DevLogCategory` + `CATEGORY_COLOR` ergänzen
- **Neue Sink** (z.B. Persistenz, Remote-Stream): `devlog.addSink((entry) => …)`
- **Konsolen-Inspektion**: `window.devlog` im Dev-Mode verfügbar

## Aktive Instrumentierung

- `useAuth` → `auth`-Events (onAuthStateChange, getSession, signOut)
- `useIntake` → `intake`/`db`/`edge`/`error` für jeden Schritt
- `Index.tsx` Realtime → `realtime`-Events bei assets-UPDATE
- Global → `window.error` + `unhandledrejection` als `error`

## Nicht im Scope

DB-Persistenz, Edge-Function-Logs ins Frontend streamen (separat via Supabase Function-Logs), File-Export.
