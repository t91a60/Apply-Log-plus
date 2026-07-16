# Apply Log+

[![CI](https://github.com/t91a60/Apply-Log-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/t91a60/Apply-Log-plus/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Offline-first job application tracker with end-to-end encryption.**

Track your job applications across devices — without anyone else seeing your data. All data stays in your browser (IndexedDB); sync between devices uses encrypted GitHub Gists with a password only you know.

> **🇵🇱 Wersja polska:** [README.pl.md](README.pl.md)

---

## Features

- **Offline-first** — data stored locally in IndexedDB, works without internet
- **End-to-end encrypted sync** — sync across devices via GitHub Gist, encrypted with AES-256-GCM + PBKDF2 before leaving your browser
- **Dual language** — English and Polish interface, switch anytime
- **Custom pipeline stages** — add, rename, remove stages to match your process
- **Duplicate & repost detection** — warns when the same company+role already exists or appears multiple times
- **Stale & ghosted alerts** — flags applications with no update in 14+ days or no response in 30+ days
- **Rich timeline** — full stage history with dates for every application
- **Stats dashboard** — total, active, rejected, offers, accepted at a glance
- **URL import** — paste a job posting URL to auto-fill the form
- **Export** — JSON and CSV export of all your data
- **Dark mode** — automatic (respects system preference)
- **Pairing code** — share sync config between your own devices via one-time code

---

## Tech Stack

| Layer | Choice |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Build** | Vite 8 |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Storage** | Dexie.js (IndexedDB) |
| **State / Server** | TanStack Query |
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

# install
pnpm install

# dev server
pnpm dev

# lint + test
pnpm lint
pnpm test
pnpm test:coverage   # with coverage report
pnpm test:e2e        # E2E tests (requires Chromium)
```

### Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9

---

## Synchronisation (E2EE)

Sync uses GitHub Gists as a transport layer. Your data is **encrypted before it leaves your browser**:

1. Open **Sync** panel in the app
2. Enter your **GitHub Personal Access Token** (scope: `gist`)
3. Set a **strong encryption password** — this is never stored, you re-enter it each session
4. Push your data to a private Gist
5. On another device, enter the same token + password and pull

For same-network setup, use the **Pairing Code** — a one-time code that bundles your config (still encrypted, but transmitted in plain text — only share directly between your own devices).

> ⚠️ The encryption password is **never saved** in the app or on GitHub. If you lose it, your synced data cannot be recovered.

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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, commit checklist, and code guidelines.

---

## Security

See [SECURITY.md](SECURITY.md) for the threat model, scope, and vulnerability reporting.

---

## License

MIT — see [LICENSE](LICENSE).

---

## Why Apply Log+?

Most job trackers are SaaS — your data lives on someone else's server. Apply Log+ is built for privacy-first job seekers who want full control over their application data without trusting a third party.
