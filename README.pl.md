# Apply Log+

[![CI](https://github.com/t91a60/Apply-Log-plus/actions/workflows/main.yml/badge.svg)](https://github.com/t91a60/Apply-Log-plus/actions/workflows/main.yml)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Tracker aplikacji o pracę z lokalnym zapisem i opcjonalną szyfrowaną synchronizacją.

Rejestruj aplikacje o pracę lokalnie w IndexedDB. Opcjonalna synchronizacja wysyła zaszyfrowaną migawkę do GitHub Gist; import ofert z URL korzysta z zewnętrznych usług proxy.

> [Otwórz aplikację](https://t91a60.github.io/Apply-Log-plus/) · [English version](README.md) · [Uwagi bezpieczeństwa](SECURITY.md)

---

## Stan

Beta, ocena z 2026-10-23. Testy lokalne i build przeszły. W audycie nie sprawdzono synchronizacji między urządzeniami ani zachowania offline w przeglądarce. [Wyniki i ograniczenia (EN)](docs/STATUS.md).

## Funkcje

- Zapis aplikacji w IndexedDB i edycja własnych etapów rekrutacji.
- Polski i angielski interfejs.
- Ostrzeżenia o powtórzonej parze firma/stanowisko.
- Alerty o braku aktualizacji przez 14+ dni lub odpowiedzi przez 30+ dni.
- Historia etapów z datami i liczniki według statusu rekrutacji.
- Import danych oferty z URL przez zewnętrzne proxy.
- Eksport rekordów do JSON i CSV.
- Jasny lub ciemny motyw zgodny z ustawieniami systemu.
- Wysyłanie i pobieranie migawek Gist szyfrowanych AES-256-GCM i PBKDF2.
- Przenoszenie konfiguracji kodem base64. Kod zawiera token i hasło szyfrowania; nie wygasa i można go użyć ponownie.

---

## Stack technologiczny

| Warstwa | Wybór |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Build** | Vite 8 |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Storage** | Dexie.js (IndexedDB) |
| **Dostęp do danych i cache** | TanStack Query |
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
pnpm install --frozen-lockfile
pnpm dev
```

### Wymagania

- **Node.js 24 i pnpm 11**, zgodnie z konfiguracją CI. Niższe minima w `package.json` nie gwarantują zgodności wszystkich narzędzi.

## Ograniczenia i testy

- Pobranie Gista usuwa i zastępuje lokalne aplikacje oraz własne etapy. Brak scalania konfliktów i wspólnej transakcji obu tabel. Najpierw wykonaj eksport kopii.
- IndexedDB przechowuje rekordy lokalnie, ale aplikacja nie ma service workera do zapisu plików strony w cache. Ponowne otwarcie bez internetu nie jest gwarantowane.
- Token GitHub jest zapisany w IndexedDB bez szyfrowania aplikacyjnego. Szyfrowanie danych synchronizacji nie chroni tokena przed skryptami z tego samego originu.
- Import URL wysyła adres oferty do `corsproxy.io` lub `api.allorigins.win` i może zawieść. Nie używaj prywatnych adresów ani linków zawierających tokeny.
- Audyt: `pnpm test` PASS (117 testów), `pnpm build` PASS z ostrzeżeniem rozmiaru paczki, `pnpm lint` kod 0 z trzema ostrzeżeniami. Nie uruchomiono E2E, coverage ani rzeczywistej synchronizacji Gist.

---

## Synchronizacja (E2EE)

Sync wykorzystuje GitHub Gist jako warstwę transportową. Dane są **szyfrowane przed opuszczeniem przeglądarki**:

1. Otwórz panel **Sync** w aplikacji
2. Wpisz **GitHub Personal Access Token** (zakres: `gist`)
3. Ustaw silne hasło szyfrowania. Aplikacja nie utrwala go w IndexedDB.
4. Wyślij dane do niepublicznego Gista (`public: false`). Znajomość adresu pozwala go odczytać; ochronę treści zapewnia szyfrowanie.
5. Na drugim urządzeniu wpisz ten sam token + hasło i pobierz

**Kod parowania** zawiera token GitHub, hasło szyfrowania i opcjonalny identyfikator Gista w base64. **Nie jest zaszyfrowany**, nie ma wymuszonego wygaśnięcia i można go użyć ponownie. Nie wysyłaj go przez czat, e-mail, zrzut ekranu ani publiczne zgłoszenie. Przekazuj wyłącznie bezpośrednio między własnymi urządzeniami; aplikacja nie wymusza ograniczenia do tej samej sieci.

> Hasło nie jest utrwalane w IndexedDB ani wysyłane jawnym tekstem do Gista synchronizacji, ale wygenerowany kod parowania zawiera je wprost. Przy wycieku kodu unieważnij zawarty w nim token i potraktuj hasło jako ujawnione. Utrata hasła uniemożliwia odszyfrowanie zsynchronizowanej migawki.

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

MIT. Zobacz [LICENSE](LICENSE).
