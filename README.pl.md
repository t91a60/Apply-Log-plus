# Apply Log+

[English](README.md) · [GitHub Pages](https://t91a60.github.io/Apply-Log-plus/) · [Bezpieczeństwo](SECURITY.md)

Apply Log+ to dziennik rekrutacji działający w przeglądarce. Zapisuj firmy, stanowiska, linki i notatki, sprawdzaj historię etapów, a w razie zmiany przeglądarki zabierz dane ze sobą.

- **Rekrutacje:** Dodawaj i edytuj zgłoszenia oraz własne etapy. Wyszukuj oferty, filtruj według etapu i sprawdzaj statystyki.
- **Tryb lokalny:** Do prowadzenia dziennika nie potrzebujesz konta ani tokena. Wydanie produkcyjne otwiera się offline po pierwszej wizycie online, jeśli przeglądarka zdąży pobrać pliki.
- **Kopia zapasowa:** Eksportuj JSON z historią i własnymi etapami. CSV służy do analizy w arkuszu, nie do przywracania.
- **Opcjonalny Gist:** Ręcznie przesyłaj zaszyfrowaną migawkę między urządzeniami lub przenieś plik JSON bez konta GitHub.

## Kopia i przywracanie

Wybierz **Eksportuj JSON** i zapisz plik w miejscu, do którego masz dostęp. W drugiej przeglądarce wybierz **Przywróć JSON**, wskaż plik i sprawdź jego podsumowanie przed potwierdzeniem. Przywrócenie zastępuje aplikacje i własne etapy zamiast je scalać. Limit importu to 16 MiB.

Dane lokalne należą do bieżącego profilu przeglądarki i adresu aplikacji. Wyczyszczenie danych witryny albo zmiana adresu lub profilu może pozbawić Cię do nich dostępu. Aplikacja nie szyfruje danych w IndexedDB ani plików JSON i CSV, dlatego przechowuj kopię w bezpiecznym miejscu.

## Przenoszenie zaszyfrowanej migawki przez Gist

Przenoszenie przez Gist jest w tym wydaniu funkcją testową. Zacznij od fikcyjnych danych i przechowuj niezależną kopię JSON.

1. Najpierw wyeksportuj lokalny JSON. Utwórz dedykowany, wygasający token GitHub wyłącznie do Gistów. Dla tokena fine-grained jest to uprawnienie użytkownika **Gists: write** ([dokumentacja API Gist](https://docs.github.com/en/rest/gists/gists)).
2. Otwórz **Synchronizacja**, wpisz token i mocne, unikalne hasło o długości co najmniej 16 znaków. Zostaw puste **Gist ID** i wybierz **Wyślij do Gista**. Zachowaj hasło w menedżerze haseł.
3. Na innym urządzeniu wpisz osobno ID Gista, odpowiedni token i to samo hasło. Jeśli są tam lokalne dane, zrób ich kopię. Potwierdź zastąpienie i wybierz **Pobierz z Gista**.

Nie ma automatycznej synchronizacji ani scalania zmian. Wysłanie na istniejący ID zastępuje migawkę Gista; pobranie zastępuje dane lokalne. Nie wysyłaj równolegle z kilku urządzeń. Limit zaszyfrowanej migawki to 1 MB. [Ukryty Gist nie jest prywatny](https://docs.github.com/en/get-started/writing-on-github/editing-and-sharing-content-with-gists/creating-gists): każdy, kto zna adres, może odczytać zaszyfrowany plik.

Starsze kody parowania zawierały poświadczenia. Jeśli korzystasz ze starszej wersji, przeczytaj [instrukcję rotacji tokena i hasła](SECURITY.md#legacy-pairing-and-credential-rotation).

## Uruchomienie lokalne

Wymagane są Node.js 24 i pnpm 11. Zwykłe uruchomienie nie wymaga pliku `.env`, tokena ani konta.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Otwórz `http://localhost:5173/Apply-Log-plus/`. Do testu trybu offline użyj `pnpm build`, a następnie `pnpm preview`. Polecenia weryfikacji i scenariusze są w [CONTRIBUTING.md](CONTRIBUTING.md) i [FLOWS.md](FLOWS.md).

Licencja: [MIT](LICENSE).
