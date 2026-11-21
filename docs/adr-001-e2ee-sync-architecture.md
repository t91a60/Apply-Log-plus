# ADR-001: Password-encrypted snapshot transfer via GitHub Gist

**Status:** Accepted; revised for the next release

## Decision

Use local IndexedDB for applications and custom stages. A user may separately export a plaintext JSON backup or upload a password-encrypted snapshot to GitHub Gist. Neither workflow requires an application backend.

## Rules

- **Credentials:** No pairing-code generation or decoding. The sync dialog retains the token and passphrase only in memory. Persist the validated Gist ID, not the secrets, and clear known legacy credential keys.
- **Envelope:** Maintain compatibility with existing ciphertext: base64 of the 16-byte salt, 12-byte nonce and AES-256-GCM ciphertext with its 16-byte tag. Derive the key with PBKDF2-SHA-256 and 600,000 iterations. New snapshots require a passphrase of at least 16 characters; legacy snapshots remain readable with their original passphrase.
- **Transport:** Use one unlisted Gist file through the [GitHub Gist REST API](https://docs.github.com/en/rest/gists/gists). Reject public Gists, missing files, and truncated content rather than following arbitrary URLs.
- **Replacement:** Validate the full snapshot before any local write. Compare the current local state with the pre-download state and replace both stores in one transaction. Before an upload replaces an existing snapshot, verify that the old snapshot decrypts and validates with the supplied passphrase.
- **Limits:** No automatic sync, conflict merge or protection from simultaneous writers publishing over one another. A Gist URL is not an access control; confidentiality relies on the passphrase.

The previous design traded security for credential pairing. That mechanism was removed; see the [security policy](../SECURITY.md) for credential rotation and older Gist revisions.
