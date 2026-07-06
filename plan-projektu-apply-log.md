# Apply Log+ — Plan projektu

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
- **Import metadanych z linku oferty** — parsowanie meta tagów strony przy dodawaniu aplikacji, mniej ręcznego wpisywania
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
2. **PAT przechowywany w IndexedDB**, nie w localStorage, z jasnym opisem zakresu uprawnień w UI.
3. **Parowanie urządzeń przez QR/krótki kod** zamiast ręcznego przepisywania Gist ID.
4. Model "brak własnego serwera" zostaje — to mocna cecha oryginału — ale disclaimer o naturze Gista trafia do onboardingu, nie tylko do README.

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
5. Push na `main` uruchamia deploy automatycznie

## 8. Roadmapa

**Faza 1 — fundament:** setup projektu, model danych w Dexie, CRUD aplikacji, tabela z filtrami/search. ✅ ukończono

**Faza 2 — core UX:** custom stages, stats cards, i18n, timeline zmian statusu. ✅ ukończono

**Faza 3 — sync bezpieczny:** szyfrowanie E2E, Gist sync, parowanie urządzeń. ✅ ukończono

**Faza 4 — inteligentne dodatki:** wykrywanie duplikatów/reposted ofert, przypomnienia o braku odpowiedzi, import metadanych z linku. ✅ ukończono

**Faza 5 — hosting:** konfiguracja GitHub Pages, workflow Actions, publiczny deploy. ✅ ukończono

**Faza 6 — polish:** rozszerzone statystyki, eksport JSON/CSV, testy i lint dociągnięte do pełnego pokrycia krytycznych ścieżek.
