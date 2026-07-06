# Apply Log+

Pełny plan: plan-projektu-apply-log.md — to źródło prawdy dla architektury i roadmapy.

## Stack
React 19 + TS, Vite 8, Tailwind v4 + shadcn/ui, Dexie.js (IndexedDB — nie SQLite WASM),
TanStack Query, Zod, i18next, Vitest, oxlint.

## Zasady
- Każda nowa funkcja ma testy w Vitest.
- Commit dopiero gdy `pnpm test` i `pnpm lint` przechodzą bez błędów.

## Komendy
pnpm dev / pnpm build / pnpm test / pnpm lint