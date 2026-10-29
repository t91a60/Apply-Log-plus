# Apply Log+

[![CI](https://github.com/t91a60/Apply-Log-plus/actions/workflows/main.yml/badge.svg)](https://github.com/t91a60/Apply-Log-plus/actions/workflows/main.yml)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Job application tracker with local storage and optional encrypted sync.

Track job applications in your browser using IndexedDB. Optional sync sends an encrypted snapshot to a GitHub Gist; URL import uses external proxy services.

> [Open the app](https://t91a60.github.io/Apply-Log-plus/) · [Wersja polska](README.pl.md) · [Security notes](SECURITY.md)

---

## Status

Beta, assessed on 2026-10-23. Local tests and build passed. Cross-device sync and offline browser behavior were not tested. See [limitations and verification](#limitations-and-verification).

## Features

- Store applications in IndexedDB and manage custom recruitment stages.
- Switch between English and Polish.
- Check for duplicate company/role pairs.
- Flag applications with no update for 14+ days or no response for 30+ days.
- View stage history, dates and counts by recruitment status.
- Import job metadata from a URL through external proxies.
- Export records as JSON or CSV.
- Use the system's light or dark theme preference.
- Push and pull Gist snapshots encrypted with AES-256-GCM and PBKDF2.
- Transfer sync configuration using a base64 pairing code. The code includes the token and encryption password; it has no expiry or single-use protection.

---

## Tech Stack

| Layer | Choice |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Build** | Vite 8 |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Storage** | Dexie.js (IndexedDB) |
| **Data access and cache** | TanStack Query |
| **Validation** | Zod |
| **i18n** | i18next + react-i18next |
| **Sync** | GitHub Gist API + AES-256-GCM E2EE |
| **Tests** | Vitest (unit), Playwright (E2E) |
| **Linting** | oxlint |

---

## Getting Started

```bash
# clone
git clone https://github.com/t91a60/Apply-Log-plus.git
cd Apply-Log-plus

# install exactly as locked
pnpm install --frozen-lockfile

# dev server
pnpm dev
# open http://localhost:5173/Apply-Log-plus/ (or the URL printed by Vite)

# lint + test
pnpm lint
pnpm test
pnpm test:coverage   # with coverage report
pnpm test:e2e        # E2E tests (requires Chromium)
```

### Build and configuration

```bash
pnpm build
pnpm preview
```

The build writes `dist/`. The Vite base path is `/Apply-Log-plus/`; keep this path when serving the build or adjust `vite.config.ts` for a different hosting location. The GitHub Actions workflow runs lint, build and unit tests, then deploys successful pushes to `main` to GitHub Pages.

Local tracking needs no account, server or environment variables. Configure optional sync in the app's **Sync** panel. `.env.example` contains a token placeholder, but the sync code reads its token from IndexedDB rather than `VITE_GITHUB_PAT`. Do not put credentials in Vite environment variables: values exposed to browser code become public build assets.

### Prerequisites

- **Node.js 24 and pnpm 11** match the repository CI configuration. The broader minimums in `package.json` do not guarantee compatibility with every installed tool version.

## Limitations and verification

- Pulling a Gist clears and replaces local applications and custom stages. There is no conflict merge or transaction covering both tables; export a backup first.
- IndexedDB stores records locally, but there is no service worker to cache the app itself. Reopening the page offline is not guaranteed.
- The GitHub token is saved in IndexedDB without application-level encryption. Encrypting sync data does not protect the token against scripts running in the same origin.
- URL import sends the job URL to `corsproxy.io` or `api.allorigins.win` and may fail for unsupported pages. Do not import private or token-bearing URLs.
- Documentation verification on 2026-10-29: `pnpm test` passed (125 tests); `pnpm build` passed with a chunk-size warning; `pnpm lint` exited successfully with three warnings. E2E, coverage and live Gist sync were not run.

---

## Everyday use

Add an application with a company, role and recruitment stage. Open an existing record to update its stage and review its timeline. Use custom stages for your own process and export JSON or CSV before replacing local data through sync. JSON and CSV exports are readable files; keep application details and notes in a trusted location.

For browser tests, install Chromium once with `pnpm exec playwright install chromium` before `pnpm test:e2e`.

## Synchronisation (E2EE)

Sync uses GitHub Gists as a transport layer. Your data is **encrypted before it leaves your browser**:

1. Open **Sync** panel in the app
2. Enter your **GitHub Personal Access Token** (scope: `gist`)
3. Set a strong encryption password. The app does not persist it to IndexedDB.
4. Push your data to a secret Gist (`public: false`). Its unlisted URL is not access control; the payload is encrypted.
5. On another device, enter the same token + password and pull

The **Pairing Code** bundles the GitHub token, encryption password and optional Gist ID in base64. It is **not encrypted**, has no enforced expiry and can be reused. Never send it through chat, email, screenshots or a public issue. Transfer it only directly between devices you control; the app does not enforce a same-network restriction.

> The encryption password is not persisted to IndexedDB or sent as plaintext to the sync Gist, but generating a pairing code explicitly includes it in that code. If a code leaks, revoke the included token and treat the encryption password as compromised. Losing the password prevents decryption of the synced snapshot.

---

## Project Structure

```
src/
  __tests__/        # Unit tests
  components/
    applications/   # ApplicationTable, ApplicationDialog, StatsCards, StageBadge, Timeline
    sync/           # SyncPanel
    ui/             # shadcn/ui primitives (button, input, dialog, badge)
  db/               # Dexie schema & database
  hooks/            # TanStack Query hooks
  i18n/             # Translation resources (en, pl)
  lib/              # Utilities (cn, export)
  sync/             # Encryption (AES-GCM), sync manager, Gist API
  App.tsx           # Root component
  main.tsx          # Entry point
```

---

## Troubleshooting

- **Build tools reject Node.js:** use Node.js 24 and pnpm 11, matching CI, and reinstall with the frozen lockfile.
- **Blank page on another host:** check that the deployment serves the configured `/Apply-Log-plus/` base path.
- **Gist pull fails:** confirm the token, Gist ID and encryption password. Export local data before retrying a pull; a successful pull replaces it.
- **URL import fails:** enter the details manually when a site blocks the external proxies or has unsupported markup.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, commit checklist, and code guidelines.

---

## Security

See [SECURITY.md](SECURITY.md) for the threat model, scope, and vulnerability reporting.

---

## License

MIT. See [LICENSE](LICENSE).
