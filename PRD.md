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

1. Guest taps NFC tag or scans QR code → opens flat URL `/g/[id]` (short, no tenant UUID exposed)
2. App opens with a personalized welcome (event name from URL params)
3. Multi-step wizard collects:
   - **Step 1 – Basics** (required): Name, optional photo
   - **Step 2 – Favorites** (optional): Color, food, movie, song, video
   - **Step 3 – Fun Facts** (optional): Superpower, talent, desert island items, preferences
   - **Step 4 – Message** (required): Personal message, how we met, best memory
4. Entry is submitted and (optionally) queued for moderation
5. Confirmation screen
6. Guest can view all approved entries at `/g/[id]/view` or slideshow at `/g/[id]/slideshow`

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
| Guestbook settings | Moderation toggle, custom welcome message, theme color, background, card styling (color/opacity/blur), font selection, with live preview |
| Entry moderation | Approve / reject entries with optional rejection reason per guestbook |
| Bulk operations | Bulk approve/reject/delete entries |
| Slideshow mode | Full-screen auto-advancing display (3–30 sec interval, keyboard/touch controls) |
| PDF export | Styled PDF with cover page, entry pages, photos, and answers |
| QR code generator | Generate QR codes as PNG/SVG for sharing (uses flat `/g/[id]` URLs) |
| Admin bar on landing page | Authenticated owners see a glassmorphic bar linking to guestbook admin |
| Live settings preview | Two-column settings dialog with real-time visual preview of customization changes |

### System-Wide

| Feature | Description |
|---|---|
| Dark/light/system theme | 3-layer initialization to prevent FOUC |
| Internationalization | English (default) and German with browser detection |
| Responsive design | Mobile-first, works on all screen sizes |
| Accessibility | a11y best practices in all UI components |

## URL Structure

### Flat URLs (guest-facing + admin, for NFC/QR sharing)
- `/g/[id]` — Guest landing page (swipeable entries + form). Shows admin bar for authenticated owners.
- `/g/[id]/view` — Guestbook entries grid (search, filter, PDF export)
- `/g/[id]/slideshow` — Full-screen slideshow
- `/g/[id]/admin` — Guestbook admin (moderation, settings with live preview, QR code)

### Dashboard
- `/dashboard` — Tenant admin (guestbook list, members, API apps)

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
- `themeColor` (string) – custom theme color (applied as CSS `--color-primary`)
- `headerImageUrl` (string) – custom header image
- `backgroundImageUrl` (string) – custom background image (cover, centered)
- `backgroundColor` (string) – custom page background color
- `cardColor` (string) – custom card background color (hex)
- `cardOpacity` (number) – card background opacity 0–100 (default: 70)
- `cardBlur` (number) – card backdrop blur 0–30px (default: 20)
- `titleFont` (`handwritten` | `display` | `sans`) – title font family (default: `handwritten`)
- `bodyFont` (`sans` | `display` | `handwritten`) – body text font family (default: `sans`)
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

## Design System

The app follows a **glassmorphism design system** documented in `DESIGN_SYSTEM.md`. Key principles: subtle transparency, backdrop-blur effects, no prominent borders, handwritten fonts for personal elements, soft rounded corners, and pulsing status indicators.

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
