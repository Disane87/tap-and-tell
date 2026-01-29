# Entry Moderation

Approve entries before public display.

## Features

- Entries start as "pending" status
- Admin reviews and approves/rejects
- Only approved entries shown publicly
- Optional: auto-approve mode toggle
- Rejection reason (optional)

## Implementation

- Add `status` field to entry schema (`pending`, `approved`, `rejected`)
- Filter public API to approved only
- Admin moderation queue UI
- Bulk approve/reject actions
