# Entry Moderation ✔

Approve entries before public display.

## Features

- [x] Entries start as "pending" status
- [x] Admin reviews and approves/rejects
- [x] Only approved entries shown publicly
- [x] Rejection reason (optional)

## Implementation

- [x] Add `status` field to entry schema (`pending`, `approved`, `rejected`)
- [x] Filter public API to approved only
- [x] Admin moderation queue UI with tabs
- [x] Bulk approve/reject actions
- [x] Status badges on entries
- [x] Localized UI (EN/DE)
