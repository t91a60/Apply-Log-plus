# Apply Log+ — Plan projektu

> Plan historyczny, nie aktualna instrukcja wdrożenia. Ocena z 2026-10-23 i granice weryfikacji: [docs/STATUS.md](docs/STATUS.md). Poniższe propozycje architektury nie są dowodem implementacji. Obecny workflow to `.github/workflows/main.yml`; aktualne polecenia i wersje środowiska są w README i konfiguracji CI, nie w przykładowym YAML poniżej.

## 1. Cel projektu

Apply Log+ to tracker aplikacji o pracę działający w całości w przeglądarce — bez własnego backendu, bez konta. Użytkownik loguje każdą aplikację (firma, rola, etap, data, link do oferty), śledzi jej cykl życia i — kluczowa przewaga nad arkuszem kalkulacyjnym — dostaje narzędzia do wyłapywania firm, które odrzucają kandydatów, a potem wystawiają tę samą ofertę ponownie.

Projekt bazuje na pomyśle istniejącego repo o tej samej idei, ale z poprawioną architekturą danych, bezpieczniejszym mechanizmem synchronizacji i rozszerzonym zakresem funkcji.

## 2. Stack technologiczny

| Warstwa | Wybór | Uzasadnienie |
|---|---|---|
| Framework | React 19 + TypeScript | dojrzały, aktualny wybór — brak powodu do zmiany |
| Build | Vite 8 | szybki dev server i build |
| Styling | Tailwind CSS v4 + shadcn/ui | standard dla tego typu aplikacji, szybkie prototypowanie |
| Dane lokalne | **Dexie.js (IndexedDB)** zamiast SQLite WASM | lżejsze, prostsze w utrzymaniu; SQLite WASM to przerost formy dla prostych rekordów aplikacji o pracę |
| Data fetching / cache | TanStack Query | ujednolica stany ładowania nawet dla danych lokalnych |
| Walidacja | Zod | |
| i18n | i18next + react-i18next | EN/PL |
| Testy | Vitest + Testing Library | |
| Lint | oxlint | szybkość ważniejsza niż kompletność reguł na tym etapie |

Jedyne dwie realne zmiany względem punktu wyjścia to **silnik danych** (Dexie zamiast SQLite WASM) i **model synchronizacji** (opisany niżej) — reszta stacku jest dobrze dobrana i nie wymaga wymiany.

## 3. Kluczowe koncepcje

- **Application (aplikacja)** — firma, rola, data, link do oferty, notatki, historia zmian etapów.
- **Stage (etap)** — Applied, Interview, Offer, Rejected, Ghosted + własne, definiowane przez użytkownika.
- **Sync** — opcjonalna synchronizacja danych między urządzeniami przez prywatny Gist na GitHub, szyfrowana po stronie klienta.

## 4. Zakres funkcji

**Rdzeń (must-have):**
- Tabela aplikacji z pełnym CRUD
- Własne etapy + etapy domyślne
- Karty statystyk (liczba aplikacji per etap)
- Filtrowanie i wyszukiwanie po firmie/roli
- Pełne PL/EN i18n

**Rozszerzenia względem oryginału:**
- **Wykrywanie duplikatów/reposted ofert** — dopasowanie po nazwie firmy + roli, żeby złapać firmy odrzucające kandydatów i wystawiające tę samą ofertę ponownie
- **Timeline per aplikacja** — pełna historia zmian etapów z datami, nie tylko aktualny status
- **Przypomnienia o braku odpowiedzi** — flaga w tabeli po X dniach ciszy, opcjonalne powiadomienia przeglądarki
- **Linki do ofert** — ręczne zapisanie i otwarcie linku. Brak pobierania metadanych przez publiczne proxy.
- **Rozszerzone statystyki** — czas odpowiedzi per firma/branża, response rate w czasie
- **Eksport danych do JSON/CSV** — niezależnie od mechanizmu sync

## 5. Architektura

```
UI (React + shadcn/ui)
   ↓
Stan UI (Context/Zustand) — filtry, widoki
   ↓
TanStack Query — warstwa dostępu do danych, cache, stany ładowania
   ↓
Dexie.js (IndexedDB) — źródło prawdy, dane lokalne
   ↓
Warstwa sync (opcjonalna, on-demand) — szyfrowanie + GitHub Gist API
```

Zasada: aplikacja jest w pełni funkcjonalna offline i bez konfiguracji sync. Synchronizacja to dodatek, nie wymóg.

## 6. Synchronizacja i bezpieczeństwo

Oryginalny model (PAT w localStorage, jawne dane w sekretnym Giście) ma dwie słabości: token czytelny dla każdego skryptu na stronie (podatność na XSS) i dane w Giście nieszyfrowane — każdy z linkiem je odczyta.

Poprawki:
1. **Szyfrowanie end-to-end** — dane szyfrowane hasłem użytkownika (Web Crypto API, AES-GCM) przed wysłaniem do Gista.
2. **PAT i hasło tylko w pamięci otwartego okna synchronizacji.** IndexedDB zapamiętuje jedynie ID Gista; stary token jest usuwany.
3. **Przenoszenie migawki na drugie urządzenie:** przepisz ID Gista; token i hasło podaj osobno. Nie generujemy kodu zawierającego sekrety.
4. Brak własnego serwera. GitHub Gist jest opcjonalny, a zastępowanie migawki wymaga potwierdzenia i nie scala zmian.

## 7. Hosting i wdrożenie (GitHub Pages + Actions)

Aplikacja nadaje się na GitHub Pages bez zmian architektonicznych — cała logika działa po stronie klienta.

**Konfiguracja:**
- `base` w `vite.config.ts` ustawiony na nazwę repo (`/nazwa-repo/`), inaczej assety nie załadują się pod `username.github.io/nazwa-repo/`.
- Routing: `HashRouter` (prostsze) albo `BrowserRouter` + kopia `index.html` jako `404.html` (ładniejsze URL-e, GitHub Pages serwuje `404.html` dla nieznanych ścieżek, co pozwala SPA przejąć routing).
- Gist sync działa bez zmian — to zwykłe wywołania `fetch` do GitHub API z klienta.

**Workflow (`.github/workflows/deploy.yml`):**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Checklist wdrożenia:**
1. Settings → Pages → Source → "GitHub Actions"
2. `base` w `vite.config.ts` ustawiony na nazwę repo
3. Decyzja: `HashRouter` czy `404.html`
4. Workflow w `.github/workflows/deploy.yml`
5. Push na `main` uruchamia weryfikację. Wdrożenie i publikacja wymagają osobnego ręcznego uruchomienia workflow.

## 8. Roadmapa

Aktualizacja dowodów: 2026-10-23. Wcześniejsze etykiety „ukończono” dla całych faz nie potwierdzały kompletności ich kryteriów.

### Done (zweryfikowane)
- [x] Lokalny model Dexie, komponenty trackera i testy: `pnpm test` PASS, 117 testów; `pnpm build` PASS.
- [x] Implementacja szyfrowania, transportu Gist i eksportu istnieje w `src/sync/` i `src/lib/export.ts`. To dowód obecności kodu, nie zaliczony test między urządzeniami.
- [x] Workflow lint/build/test/deploy istnieje; publiczny adres odpowiedział HTTP 200. Nie wykonano testu funkcjonalnego demo.

### In progress
Brak potwierdzonego aktywnego zadania implementacyjnego w tym audycie. Nie przypisano pracy na podstawie samego planu.

### Planned
- [ ] Rozszerzone statystyki z pierwotnego zakresu. Kryterium: konkretne miary czasu odpowiedzi/response rate, implementacja i testy; same karty liczników tego nie potwierdzają.
- [ ] Weryfikacja synchronizacji na dwóch testowych urządzeniach i odtworzenia eksportu. Kryterium: zapisane wyniki scenariuszy push/pull, utraty połączenia i nadpisania danych, bez prawdziwych danych osobowych.

### Blocked
- [ ] Deklaracja stable i pełnego pokrycia krytycznych ścieżek: brak wyniku E2E, coverage oraz potwierdzenia ponownego otwarcia offline. Kryterium odblokowania: opublikowane wyniki dla konkretnego commita i jawny opis ograniczeń, nie sama zielona kompilacja.
