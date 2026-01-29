# Admin Panel ✔

Password-protected page to manage guestbook entries.

## Completed

- [x] Simple password authentication (environment variable via `ADMIN_PASSWORD`)
- [x] View all entries in list format
- [x] Delete individual entries with confirmation dialog
- [x] `/admin` page with password gate (`app/pages/admin/login.vue`, `app/pages/admin/index.vue`)
- [x] `useAdmin` composable for auth state (sessionStorage token)
- [x] Server middleware for protected API routes (`server/utils/auth.ts`)
- [x] Admin-specific API endpoints (`/api/admin/login`, `/api/admin/entries`, `/api/admin/entries/[id]`)
- [x] HMAC-SHA256 token generation with 24-hour expiry

## Not Implemented

- [ ] Bulk delete functionality
- [ ] View entry statistics (total count, entries per day)
