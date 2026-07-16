# Security Policy

## Reporting a Vulnerability

This project handles personal data (job applications, recruiter contacts) and supports encryption for cloud sync. If you discover a security vulnerability, please report it privately by opening a GitHub Issue with the label `security` or contacting the maintainer directly.

Do not disclose the vulnerability publicly until it has been addressed.

## Scope

- **E2E encryption**: AES-GCM with PBKDF2 (600k iterations). Encryption password is never persisted to IndexedDB.
- **GitHub Gist sync**: Data is encrypted before being sent to Gist. A GitHub Personal Access Token with `gist` scope is required.
- **Pairing code**: Contains base64-encoded access data in plaintext. The UI warns users to only share it directly between their own devices.
- **IndexedDB**: All local data is stored in the browser's IndexedDB. No server-side storage.
- **Third-party CORS proxy**: URL metadata import uses public proxies (corsproxy.io, allorigins.win). No sensitive data is sent through them.

## Best practices for users

- Use a dedicated GitHub PAT with minimal scope (`gist` only).
- Use a strong, unique encryption password for Gist sync.
- Clear sync configuration when using a shared/public computer.
- Pairing code contains your token in plaintext — only scan/generate on your own devices.
