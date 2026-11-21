# Apply Log+

[Polski](README.pl.md) · [GitHub Pages](https://t91a60.github.io/Apply-Log-plus/) · [Security](SECURITY.md)

Apply Log+ keeps a record of your job applications in your browser. Track where you applied, see how each application progressed, and keep a copy you can take to another browser.

- **Applications:** Track companies, roles, notes, links and stage history. Search or filter the list, and add your own stages.
- **Local storage:** Routine tracking needs no account, token, or backend. The production app can reopen offline after an online visit has finished caching its files.
- **Backup:** Export JSON with notes, history and custom stages, or CSV for a spreadsheet. Restore JSON into another profile after reviewing what will be replaced.
- **Optional Gist transfer:** Upload and download an encrypted snapshot manually. GitHub is not needed if you transfer a JSON file instead.

## Back up your data

Use **Export JSON**, then move the file to a place you control. In another browser, choose **Restore JSON**, select your file, and confirm only after backing up any records already in that browser. Restore replaces both the applications and the custom stages; it does not merge them. The import limit is 16 MiB.

Local data lives in the current browser profile and site origin. Clearing site data, changing hosts or switching browser profiles can make it unavailable. IndexedDB and JSON/CSV exports are not encrypted by this app. Only export CSV for analysis; it is not a restorable backup.

## Transfer an encrypted snapshot via Gist

1. Export your local JSON backup first. Create a dedicated, expiring GitHub token with only Gist access. A fine-grained token needs the **Gists: write** user permission ([GitHub Gist API](https://docs.github.com/en/rest/gists/gists)).
2. Open **Sync**, enter the token and a strong, unique passphrase of at least 16 characters, leave **Gist ID** blank, and choose **Push to Gist**. Keep the passphrase in a password manager.
3. In the other browser, enter the Gist ID, a suitable token, and the same passphrase separately. Export any data you want to keep, confirm replacement, and choose **Pull from Gist**.

Sync does not run automatically or merge changes. An upload to an existing ID replaces its snapshot; a download replaces local records. Avoid pushing from multiple devices at once. The app refuses public, incomplete and unrelated Gists and caps encrypted uploads at 1 MB. A [secret Gist is unlisted, not access-controlled](https://docs.github.com/en/get-started/writing-on-github/editing-and-sharing-content-with-gists/creating-gists), so use a strong passphrase and do not share the URL unnecessarily.

Older pairing codes contained credentials. If you used or shared one, read the [migration and incident guidance](SECURITY.md#legacy-pairing-and-credential-rotation) before relying on Gist again.

## Run locally

Use Node.js 24 and pnpm 11. No `.env` file or credential is required for local development.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:5173/Apply-Log-plus/`. For the production build and offline behavior, run `pnpm build` then `pnpm preview`. For local release checks, see [CONTRIBUTING.md](CONTRIBUTING.md) and [FLOWS.md](FLOWS.md).

Licensed under [MIT](LICENSE).
