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

| Route | Purpose |
|---|---|
| `/` | Marketing landing page (hero, features, how it works) |

| `/login` | Owner login |
| `/register` | Owner registration |
| `/dashboard` | Redirect to tenant admin (`/t/[uuid]/admin`) or create-tenant flow |
| `/t/[uuid]` | Tenant root — redirects to first guestbook |
| `/t/[uuid]/admin` | Tenant admin (guestbook list, members) |
| `/t/[uuid]/g/[gbUuid]` | Guestbook guest form |
| `/t/[uuid]/g/[gbUuid]/guestbook` | Guestbook entries view |
| `/t/[uuid]/g/[gbUuid]/slideshow` | Guestbook slideshow |
| `/t/[uuid]/g/[gbUuid]/admin` | Guestbook admin (moderation) |
| `/t/[uuid]/g/[gbUuid]/admin/qr` | Guestbook QR code generator |
| `/admin/login` | Legacy admin login |
| `/admin` | Legacy admin dashboard |
| `/admin/qr` | Legacy QR code generator |

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

| Layer | Technology |
|---|---|
| Framework | Nuxt 4.3 (SSR disabled, client-side SPA) |
| Language | TypeScript |
| UI Components | shadcn-vue / Radix Vue / Reka UI |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Icons | Lucide (via lucide-vue-next) / Iconify |
| Database (local) | SQLite via better-sqlite3 |
| Database (prod) | Turso (LibSQL) |
| ORM | Drizzle ORM |
| Auth | JWT via jose (HTTP-only cookies) |
| i18n | @nuxtjs/i18n v10 |
| PWA | @vite-pwa/nuxt |
| PDF | jsPDF |
| QR Codes | qrcode |
| Notifications | vue-sonner |
| Utilities | @vueuse/core |
| Package Manager | pnpm |
| Deployment | Vercel (primary), Docker (self-hosted) |

## Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | SQLite file path | `file:.data/data.db` |
| `TURSO_DATABASE_URL` | Turso production URL | – |
| `TURSO_AUTH_TOKEN` | Turso auth token | – |
| `JWT_SECRET` | Owner auth JWT signing secret | insecure default |
| `ADMIN_PASSWORD` | Legacy admin password | `admin123` |
| `TOKEN_SECRET` | Legacy token signing secret | `tap-and-tell-secret` |
| `DATA_DIR` | Photo storage directory | `.data` |
| `NODE_ENV` | Environment mode | `development` |

> All secret defaults must be overridden in production.

## Known Issues

- `DELETE /api/entries/[id]` is public (no auth required) – security risk
- Default credentials are insecure – must be set via env vars in production
- ~40 pre-existing typecheck errors for missing `@types/node` globals

## Future / Planned

- Monetization & Stripe integration (Plans 28–29)
- Enhanced UX polish (Plan 32)
- Customization options (Plan 34)
- Relative timestamps (Plan 23)
- Release plan finalization (Plan 31)
