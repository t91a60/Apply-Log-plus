# Security Policy

## Reporting a Vulnerability

This project handles personal data (job applications, recruiter contacts) and supports encryption for cloud sync. Report a suspected vulnerability privately to [the maintainer](mailto:t91a60@gmail.com). A normal GitHub Issue, even with a `security` label, is public: do not put exploit details, personal data, pairing codes or tokens there.

Do not disclose the vulnerability publicly until it has been addressed.

## Scope

- **E2E encryption**: AES-GCM with PBKDF2 (600k iterations). Encryption password is never persisted to IndexedDB.
- **GitHub Gist sync**: Data is encrypted before being sent to Gist. A GitHub Personal Access Token with `gist` scope is required.
- **Pairing code**: Includes the GitHub token, encryption password and optional Gist ID in base64. This is encoding, not encryption; there is no enforced expiry or single-use protection. Transfer only directly between trusted devices. The code is sufficient to expose both the transport credentials and the decryption password.
- **IndexedDB**: Local records and the GitHub token are stored in the browser. The token has no application-level encryption and is accessible to scripts in the same origin. The app has no own backend, but optional sync stores encrypted snapshots on GitHub.
- **Third-party CORS proxy**: URL metadata import sends the supplied job URL through public proxies (`corsproxy.io`, `api.allorigins.win`). Do not submit private or token-bearing URLs. The app cannot guarantee that those addresses contain no sensitive data.

## Best practices for users

- Use a dedicated GitHub PAT with minimal scope (`gist` only).
- Use a strong, unique encryption password for Gist sync.
- Clear sync configuration when using a shared/public computer.
- A pairing code contains both your token and encryption password. If it leaks, revoke the token, change the encryption password and replace the remote snapshot. This does not revoke copies already downloaded by someone else.
