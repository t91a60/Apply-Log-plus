# Apply Log+

[![CI](https://github.com/t91a60/Apply-Log-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/t91a60/Apply-Log-plus/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Offline-first tracker aplikacji o pracę z szyfrowaniem end-to-end.**

Śledź swoje aplikacje o pracę na wielu urządzeniach — bez udostępniania danych komukolwiek. Dane pozostają w Twojej przeglądarce (IndexedDB); synchronizacja między urządzeniami wykorzystuje zaszyfrowane GitHub Gisty z hasłem, które znasz tylko Ty.

> **🇬🇧 English version:** [README.md](README.md)

---

## Funkcje

- **Offline-first** — dane lokalnie w IndexedDB, działa bez internetu
- **Szyfrowanie end-to-end** — synchronizacja przez GitHub Gist, dane szyfrowane AES-256-GCM + PBKDF2 przed opuszczeniem przeglądarki
- **Dwa języki** — polski i angielski, przełączanie w locie
- **Własne etapy rekrutacji** — dodawaj, usuwaj, zmieniaj etapy
- **Wykrywanie duplikatów** — ostrzeżenie gdy ta sama firma+stanowisko już istnieje
- **Alerty o zaległych aplikacjach** — brak aktualizacji przez 14+ dni lub brak odpowiedzi przez 30+ dni
- **Oś czasu** — pełna historia etapów dla każdej aplikacji
- **Statystyki** — wszystkie, aktywne, odrzucone, oferty, przyjęte
- **Import z URL** — wklej link do oferty, dane uzupełnią się automatycznie
- **Eksport** — JSON i CSV
- **Tryb ciemny** — automatycznie (wg ustawień systemu)
- **Kod parowania** — udostępnij konfigurację między urządzeniami jednorazowym kodem

---

## Stack technologiczny

| Warstwa | Wybór |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Build** | Vite 8 |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Storage** | Dexie.js (IndexedDB) |
| **Stan / Server** | TanStack Query |
| **Walidacja** | Zod |
| **i18n** | i18next + react-i18next |
| **Sync** | GitHub Gist API + AES-256-GCM E2EE |
| **Testy** | Vitest (unit), Playwright (E2E) |
| **Linting** | oxlint |

---

## Uruchomienie lokalne

```bash
git clone https://github.com/t91a60/Apply-Log-plus.git
cd Apply-Log-plus
pnpm install
pnpm dev
```

### Wymagania

- **Node.js** >= 20
- **pnpm** >= 9

---

## Synchronizacja (E2EE)

Sync wykorzystuje GitHub Gist jako warstwę transportową. Dane są **szyfrowane przed opuszczeniem przeglądarki**:

1. Otwórz panel **Sync** w aplikacji
2. Wpisz **GitHub Personal Access Token** (zakres: `gist`)
3. Ustaw **silne hasło szyfrowania** — nie jest zapisywane, wpisujesz przy każdej sesji
4. Wyślij dane do prywatnego Gista
5. Na drugim urządzeniu wpisz ten sam token + hasło i pobierz

Do szybkiego parowania w tej samej sieci użyj **kodu parowania**.

> ⚠️ Hasło szyfrowania **nie jest przechowywane** w aplikacji ani na GitHubie. Jeśli je zgubisz, zsynchronizowanych danych nie da się odzyskać.

---

## Struktura projektu

```
src/
  __tests__/        # Testy jednostkowe
  components/
    applications/   # ApplicationTable, ApplicationDialog, StatsCards, StageBadge, Timeline
    sync/           # SyncPanel
    ui/             # shadcn/ui (button, input, dialog, badge)
  db/               # Schemat Dexie i baza danych
  hooks/            # Hooki TanStack Query
  i18n/             # Tłumaczenia (en, pl)
  lib/              # Funkcje pomocnicze (cn, export)
  sync/             # Szyfrowanie (AES-GCM), sync manager, API Gist
  App.tsx           # Komponent główny
  main.tsx          # Punkt wejścia
```

---

## Licencja

MIT — zobacz [LICENSE](LICENSE).
