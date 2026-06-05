# Playwright-Smokes

Drei kritische Pfade gegen die laufende Preview. Lokal:

```bash
PLAYWRIGHT_USER_EMAIL=… PLAYWRIGHT_USER_PASSWORD=… bunx playwright install chromium
PLAYWRIGHT_USER_EMAIL=… PLAYWRIGHT_USER_PASSWORD=… bunx playwright test
```

Gegen Preview-Deploy ohne lokalen dev-Server:

```bash
PLAYWRIGHT_NO_SERVER=1 PLAYWRIGHT_BASE_URL=https://<dein-preview-deploy> \
PLAYWRIGHT_USER_EMAIL=… PLAYWRIGHT_USER_PASSWORD=… \
  bunx playwright test
```

Specs:

- `01-login.spec.ts` — Auth → Entität sichtbar
- `02-intake.spec.ts` — Notiz droppen → Asset im Strom
- `03-review.spec.ts` — Vorhandenes Asset → Review-Overlay sichtbar

Die Smokes sind **nicht** Teil von `bun test` (Vitest). Sie laufen nur, wenn
PLAYWRIGHT_USER_EMAIL/\_PASSWORD gesetzt sind. Im CI: eigener Workflow oder
`if: env.PLAYWRIGHT_USER_EMAIL`-Guard.
