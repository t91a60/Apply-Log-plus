# Security policy

Report suspected vulnerabilities privately to [the maintainer](mailto:t91a60@gmail.com). Never include tokens, passphrases, private Gist URLs, personal data, or reproduction details in public GitHub issues.

## Data and credentials

- **Local storage:** IndexedDB and downloaded JSON/CSV files are plaintext at the application level. Production offline caching stores only static application files, not Gist responses or exports.
- **Gist:** Snapshots use browser-side AES-256-GCM with a random salt and nonce and PBKDF2-SHA-256 with 600,000 iterations. Gist receives the ciphertext, not the passphrase. Secret Gists are [unlisted, not access-controlled](https://docs.github.com/en/get-started/writing-on-github/editing-and-sharing-content-with-gists/creating-gists).
- **Token and passphrase:** Held in memory while the sync dialog is open. The application remembers only the Gist ID and removes known credential entries from older IndexedDB versions. Browser password managers or extensions may behave independently. Never put a token in a Vite environment variable or in a repository.
- **Threat model:** Encryption protects a snapshot, not against a compromised browser profile, installed extension, malicious deployment, weak passphrase, or losses after clearing site data. It does not hide Gist metadata from GitHub or prevent concurrent writers from overwriting each other.
- **Offer links:** The app does not fetch metadata or send URLs to public proxies. Opening an offer link contacts its destination.

## Legacy pairing and credential rotation

Old pairing codes bundled the token and passphrase in base64, which is not encryption. If a code was sent, copied to shared storage, or shown to someone else, treat both credentials as exposed. Also rotate tokens that were saved by old builds if the browser or its data might have been accessed.

1. Revoke the old GitHub token. Create a new dedicated, expiring token only if you still need Gist sync.
2. Verify your local data and export a JSON backup. If the only usable copy is an encrypted Gist, use the old passphrase and a valid token to download it first.
3. Use a new, strong passphrase and leave the Gist ID blank to create a new snapshot. After verifying it, retire the old Gist and review its revisions or copies. Updating or deleting a Gist cannot revoke data someone already copied.

There is no passphrase recovery or merge service. Keep a separate backup.
