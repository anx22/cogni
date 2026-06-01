# WORKFLOW — Branch- & Release-Prozess

## Branch-Modell

```
main   ← stabil, immer grün (tsc 0, Tests grün). Nur nach abgeschlossenen Phasen.
 └─ dev ← laufende Entwicklung. Hier landet jeder Sprint-Commit.
     └─ (optional) feature/<kurzname> ← größere, riskante Arbeiten isoliert
```

- **`main`** ist der Stabilanker. Jeder Commit auf `main` muss `npm run test` und
  `npx tsc --noEmit` grün haben. Push auf `main` passiert **nur nach einer großen
  abgeschlossenen Phase** (Milestone, Sprint-Abschluss, Release).
- **`dev`** ist der Standard-Entwicklungsbranch. Hier wird täglich gearbeitet und
  committet. `dev` darf zwischendurch in Bewegung sein, sollte aber nach jedem
  Arbeitsblock grün sein.
- **`feature/<name>`** nur bei größeren oder riskanten Umbauten, die `dev` nicht
  destabilisieren sollen. Merge zurück nach `dev`, nicht direkt nach `main`.

## Standard-Zyklus

1. **Start:** `git checkout dev && git pull origin dev`
2. **Arbeiten & committen** auf `dev` (oder `feature/<name>` → später nach `dev`).
3. **Vor jedem Commit** (lokal via Husky/lint-staged automatisch):
   - `eslint --max-warnings 0`
   - `prettier --write`
4. **Vor Phasen-Abschluss** manuell verifizieren:
   - `npx tsc --noEmit` → 0 Fehler
   - `npm run test` → alle grün
5. **Phasen-Abschluss → main:**
   ```
   git checkout main
   git pull origin main
   git merge dev          # bevorzugt --no-ff für nachvollziehbare Phasen-Grenze
   git push origin main
   git checkout dev
   git merge main         # dev wieder auf main-Stand heben
   git push origin dev
   ```

## Regeln

- **Niemals** direkt auf `main` entwickeln. `main` bekommt nur fertige, grüne Phasen.
- **Niemals** force-push auf `main` oder `dev`.
- Commit-Messages: prägnant, imperativ, Phase/Scope erkennbar
  (`M1: …`, `UX cleanup: …`, `fix: …`).
- Nach Phasen-Merge nach `main`: `dev` sofort wieder auf `main`-Stand bringen,
  damit beide nicht auseinanderlaufen.

## Verifikation (Quick-Reference)

| Zweck            | Command                |
| ---------------- | ---------------------- |
| Typecheck        | `npx tsc --noEmit`     |
| Unit-Tests       | `npm run test`         |
| Lint             | `npm run lint`         |
| Format prüfen    | `npm run format:check` |
| E2E (Playwright) | `npm run test:e2e`     |
