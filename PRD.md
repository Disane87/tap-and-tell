# Product Requirements Document (PRD)

## Product Name

Tap & Tell – NFC Guestbook

## Vision

Tap & Tell is a private, minimal, and elegant digital guestbook for homes and events.
Guests tap their phone on an NFC tag (or scan a QR code) and instantly leave
a photo, personal message, and fun answers via a guided multi-step wizard.

Hosts can create multiple guestbooks, moderate entries, display a slideshow,
export entries as PDF, and manage everything from a personal dashboard.

## Target Audience

- Families and homeowners
- Private event hosts (weddings, birthdays, housewarming parties)
- Small businesses and venues wanting a digital guest experience

## Core User Flows

### Guest Flow

1. Guest taps NFC tag or scans QR code
2. App opens with a personalized welcome (event name from URL params)
3. Multi-step wizard collects:
   - **Step 1 – Basics** (required): Name, optional photo
   - **Step 2 – Favorites** (optional): Color, food, movie, song, video
   - **Step 3 – Fun Facts** (optional): Superpower, talent, desert island items, preferences
   - **Step 4 – Message** (required): Personal message, how we met, best memory
4. Entry is submitted and (optionally) queued for moderation
5. Confirmation screen

### Host / Owner Flow

1. Register an account (email + password)
2. A tenant is created automatically for new users
3. Create guestbooks within the tenant (permanent or event type)
4. Configure guestbook settings (moderation, welcome message, theme color)
5. Share the guestbook URL via NFC tag or QR code
6. Moderate incoming entries (approve / reject) per guestbook
7. View entries in guestbook, slideshow, or export as PDF

### Legacy Admin Flow

1. Login with shared admin password (Bearer token auth)
2. Manage entries for the default tenant
3. Generate QR codes

## Features

### Guest-Facing

| Feature | Description |
|---|---|
| Multi-step wizard form | 4-step guided entry with per-step validation |
| Photo upload | Camera or gallery with client-side compression (max 1920px, JPEG 80%, target <500KB) |
| NFC detection | Reads `?source=nfc&event=...` URL params to personalize welcome |
| QR code fallback | QR code alternative when NFC is unavailable |
| Offline queue | Entries queued locally when offline, submitted when back online |
| PWA | Installable as app, offline font caching via service worker |

### Host / Owner

| Feature | Description |
|---|---|
| Registration & login | Email/password auth with JWT in HTTP-only cookies |
| Tenant management | Each user has one tenant; tenant can have N guestbooks (plan-dependent) |
| Guestbook management | Create permanent or event guestbooks with individual settings |
| Guestbook settings | Moderation toggle, custom welcome message, theme color per guestbook |
| Entry moderation | Approve / reject entries with optional rejection reason per guestbook |
| Bulk operations | Bulk approve/reject/delete entries |
| Slideshow mode | Full-screen auto-advancing display (3–30 sec interval, keyboard/touch controls) |
| PDF export | Styled PDF with cover page, entry pages, photos, and answers |
| QR code generator | Generate QR codes as PNG/SVG for sharing |

### System-Wide

| Feature | Description |
|---|---|
| Dark/light/system theme | 3-layer initialization to prevent FOUC |
| Internationalization | English (default) and German with browser detection |
| Responsive design | Mobile-first, works on all screen sizes |
| Accessibility | a11y best practices in all UI components |

## Pages

See `CLAUDE.md` → Pages for the full route table.

## Data Model

### GuestEntry

| Field | Type | Required |
|---|---|---|
| id | UUID | yes |
| name | string | yes |
| message | string | yes |
| photoUrl | string | no |
| answers | GuestAnswers (JSON) | no |
| status | `pending` / `approved` / `rejected` | no (default: approved) |
| rejectionReason | string | no |
| createdAt | ISO timestamp | yes |

### GuestAnswers

- **Favorites:** favoriteColor, favoriteFood, favoriteMovie, favoriteSong (title/artist/url), favoriteVideo (title/url)
- **Fun Facts:** superpower, hiddenTalent, desertIslandItems, coffeeOrTea, nightOwlOrEarlyBird, beachOrMountains
- **Story:** howWeMet, bestMemory

### Tenant

| Field | Type | Required |
|---|---|---|
| id | UUID | yes |
| name | string | yes |
| ownerId | FK to users | yes |
| createdAt | ISO timestamp | yes |
| updatedAt | ISO timestamp | yes |

### Guestbook

| Field | Type | Required |
|---|---|---|
| id | UUID | yes |
| tenantId | FK to tenants | yes |
| name | string | yes |
| type | `permanent` / `event` | yes |
| settings | GuestbookSettings (JSON) | no |
| startDate | string | no (event only) |
| endDate | string | no (event only) |
| createdAt | ISO timestamp | yes |
| updatedAt | ISO timestamp | yes |

### GuestbookSettings

- `moderationEnabled` (boolean) – require approval before display
- `welcomeMessage` (string) – custom welcome text
- `themeColor` (string) – custom theme color
- `headerImageUrl` (string) – custom header image
- `backgroundImageUrl` (string) – custom background image
- `formConfig` (object) – form step configuration
- `customLabels` (Record) – custom label overrides

### User (Owner)

| Field | Type | Required |
|---|---|---|
| id | UUID | yes |
| email | string | yes |
| name | string | yes |
| passwordHash | string | yes |
| createdAt | ISO timestamp | yes |

## Tech Stack

See `CLAUDE.md` for the full tech stack and development setup.

## Environment Variables & Known Issues

See `CLAUDE.md` (Environment Variables) and `PROJECT_MEMORY.md` (Known Issues & Fixes).

## Future / Planned

- Monetization & Stripe integration (Plans 28–29)
- Enhanced UX polish (Plan 32)
- Customization options (Plan 34)
- Relative timestamps (Plan 23)
- Release plan finalization (Plan 31)
