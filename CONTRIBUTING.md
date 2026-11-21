# Contributing

## Stack

React 19 + TypeScript, Vite 8, Tailwind CSS v4 + shadcn/ui, Dexie.js (IndexedDB), TanStack Query, Zod, i18next, Vitest, oxlint.

## Setup

```bash
pnpm install --frozen-lockfile
pnpm dev        # start dev server
pnpm test       # run tests
pnpm lint       # run linter
pnpm build      # typecheck + production build
```

## Before committing

```bash
pnpm lint
pnpm test:coverage
pnpm exec playwright install chromium
pnpm test:e2e
```

See [the verification flows](FLOWS.md) for regression scenarios. Browser tests serve the production build so they also exercise the service worker.

## Project structure

```
src/
  __tests__/       # Vitest tests
  components/
    applications/  # ApplicationTable, ApplicationDialog, StatsCards, Timeline
    sync/          # SyncPanel
    ui/            # shadcn/ui primitives (button, input, select, etc.)
  db/              # Dexie schema, database, transactional snapshots
  hooks/           # TanStack Query hooks
  i18n/            # i18next config, EN/PL translations
  lib/             # JSON/CSV exports and UI utilities
  sync/            # Sync manager and encryption
  App.tsx          # Main app layout
  main.tsx         # Entry point
```

## i18n

All user-facing strings must be added to both `en` and `pl` in `src/i18n/index.ts`.

## Data model

Changes to `ApplicationSchema` or `CustomStageSchema` in `src/db/schema.ts` require:
1. Update the Zod schema
2. Add a Dexie migration only if IndexedDB stores or indexes change
3. Update tests in `src/__tests__/schema.test.ts`
4. Update mocks in affected tests
