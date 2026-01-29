# Admin Panel

Password-protected page to manage guestbook entries.

## Features

- Simple password authentication (environment variable)
- View all entries in a list/table format
- Delete individual entries
- Bulk delete functionality
- View entry statistics (total count, entries per day)

## Implementation

- `/admin` page with password gate
- `useAdmin` composable for auth state
- Server middleware for protected API routes
- Admin-specific API endpoints (`/api/admin/entries`)
