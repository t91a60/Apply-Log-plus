# Release verification flows

- Home: open Apply Log+, wait for IndexedDB, check the empty state or saved applications.
- Applications: create, reload, edit the role and stage, open history and stats, search, filter/reset, then cancel or confirm removal.
- Custom stages: add a stage, use it on an application, and remove it from the available options without breaking its history.
- Backup: download JSON and CSV, recover from a valid JSON file only after confirmation, and reject a malformed file without changing local records.
- Sync: open the panel without making a request, push an encrypted copy, then pull it into another browser context using a mock Gist. Reject a wrong password, malformed payload, and a pull that conflicts with a concurrent edit. No token/password is persisted or embedded in transfer instructions.
- Privacy: saving an offer link does not send it to a proxy. CSV makes formula-like values text; JSON preserves the original data.
- Offline: visit the production build once, then reopen offline; read and edit local records without a request.
- Accessibility: use keyboard focus and Escape, test both color schemes, and verify the layout at desktop and narrow widths. At 200% text size and 320 px wide, the edit form and the sync controls must remain usable without horizontal scrolling.

## Before promoting a preview to stable

Use two separate browser profiles, fictional applications, and a dedicated, expiring token with Gist access. Save a JSON backup first. Create a new secret Gist from the first profile, pull into the second, then update the snapshot and pull again. Confirm that the expected records are present and that pulling with a wrong passphrase leaves the second profile unchanged. Clean up the test Gist and revoke the test token afterwards; do not put credentials or the Gist ID in issues or test logs.
