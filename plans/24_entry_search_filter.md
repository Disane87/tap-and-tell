# Entry Search & Filter

Find entries by name or date.

## Features

- Search by guest name
- Filter by date range
- Sort options (newest, oldest)
- Clear filters button
- Result count display

## Implementation

- Search input in guestbook header
- `useEntryFilters` composable
- Client-side filtering (or server if large dataset)
- Debounced search input
- URL query params for shareable filters
