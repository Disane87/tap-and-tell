# Relative Timestamps

Display "2 hours ago" instead of absolute dates.

## Features

- Relative time display (just now, 5 min ago, 2 hours ago)
- Tooltip with absolute date on hover
- Auto-update timestamps periodically
- Localization support

## Implementation

- `useTimeAgo` composable or `@vueuse/core` timeAgo
- Update `GuestCard` component
- Refresh interval for live updates
- Fallback to date for entries older than 7 days
