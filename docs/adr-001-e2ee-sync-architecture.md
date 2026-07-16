# ADR-001: End-to-End Encrypted Sync via GitHub Gist

**Status:** Accepted  
**Date:** 2026-07-16  
**Author:** t91a60

## Context

Apply Log+ is an offline-first job application tracker. Users need to sync data between devices (laptop, desktop, phone) without trusting a third-party server with their private job search data.

Options considered:
- **Custom sync server** — most secure, but requires infrastructure, maintenance, and a backend.
- **Third-party sync service (Firebase, Supabase)** — convenient, but exposes data to the provider.
- **Browser sync (Chrome profile, iCloud)** — platform-locked, no cross-browser support.
- **File-based manual import/export** — works but friction is high.

## Decision

Use **GitHub Gist** as a free, zero-infrastructure transport layer, combined with **client-side encryption** using AES-256-GCM + PBKDF2.

### How it works

1. User provides a GitHub Personal Access Token (scope: `gist`) and an encryption password.
2. Data is serialised to JSON, **encrypted client-side** with AES-256-GCM using a key derived from the password via PBKDF2 (600 000 iterations, SHA-256).
3. The encrypted blob is uploaded to a **private GitHub Gist** via the Gist API.
4. On another device, the same token + password allow downloading and decrypting the blob.

### Encryption details

- **Key derivation:** PBKDF2 with 600 000 iterations, SHA-256, random 16-byte salt per encryption.
- **Cipher:** AES-256-GCM (authenticated encryption — detects tampering).
- **IV:** Random 12 bytes per encryption.
- **Key storage:** The derived key is marked `extractable: false` and never leaves the `crypto.subtle` context — it cannot be exported even in the same browser session.
- **Password:** Never persisted. Must be re-entered each session.

### Pairing code

For convenience, a **pairing code** bundles the GitHub token and Gist ID into a single base64 string. This is **plaintext** — the code is designed for direct device-to-device transfer (e.g., QR scan on the same LAN) and should never be sent over chat, email, or screenshot.

## Consequences

### Positive

- **Zero infrastructure** — no backend, no database, no hosting costs.
- **True E2EE** — GitHub never sees plaintext data; Gist only stores the encrypted blob.
- **Free** — GitHub Gist is free with unlimited private gists.
- **Portable** — works on any browser that supports `crypto.subtle` (all modern browsers).
- **No account lock-in** — the password is the key; no "forgot password" flow (by design).

### Negative

- **Irrecoverable** — lose the password, lose the data. No backdoor.
- **Token management** — users must create and manage a GitHub PAT (less technical users may find this challenging).
- **Plaintext pairing code** — the pairing mechanism trades some security for convenience.
- **Rate limits** — GitHub Gist API has rate limits (5 000 requests/hour authenticated).

## Alternatives considered

### Custom sync server (Node.js + PostgreSQL)
Rejected due to operational overhead, cost, and requiring users to trust another server.

### Firebase Firestore / Supabase
Rejected because even with client-side encryption, the provider still sees metadata (document IDs, timestamps, collection structure). Also introduces vendor lock-in.

### WebRTC / P2P
Rejected due to complexity of signalling, NAT traversal, and requiring both devices online simultaneously.

## Related

- [SECURITY.md](../SECURITY.md)
- `src/sync/encryption.ts` — implementation
- `src/sync/syncManager.ts` — sync orchestration
- `src/sync/githubGist.ts` — Gist API client
