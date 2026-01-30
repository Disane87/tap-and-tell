# Relative Timestamps ✔

Display "2 hours ago" instead of absolute dates.

## Features

- [x] Relative time display (just now, 5 min ago, 2 hours ago)
- [x] Tooltip with absolute date on hover
- [x] Localization support (EN/DE)
- [x] Fallback to date for entries older than 7 days

## Implementation

- [x] `@vueuse/core` useTimeAgo with localized messages
- [x] Updated `GuestCard` component with relativeTime computed
- [x] German translations inline (justNow, past, future, etc.)
