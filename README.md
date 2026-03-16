[![Nuxt](https://img.shields.io/badge/Nuxt-4.3-00DC82?logo=nuxt.js&logoColor=white)](https://nuxt.com/)
[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![pnpm](https://img.shields.io/badge/pnpm-package_manager-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![License](https://img.shields.io/github/license/Disane87/tap-and-tell)](LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/Disane87/tap-and-tell?color=red)](https://github.com/Disane87/tap-and-tell/issues)
# 🎯 Tap & Tell — NFC-Enabled Digital Guestbook

Hey there! 👋 **Tap & Tell** is a modern, NFC-powered digital guestbook that transforms how guests leave their mark at events. Guests tap their phone on an NFC tag (or scan a QR code), and a beautiful multi-step wizard guides them through leaving their name, photo, and a personal message. No app install required! 📱✨

> Perfect for weddings 💍, birthday parties 🎂, corporate events 🏢, or any gathering where you want to capture memories digitally!

> [!NOTE]
> **🤖 AI-Aided Development (AIAD)**
>
> This project openly uses AI-assisted development (e.g. Claude Code) to accelerate workflows, improve code quality, and gain more development momentum. All AI-generated code is reviewed and approved by humans — this is not a vibe-coding project, but a deliberate effort to build a useful product while exploring the boundaries, benefits, and trade-offs of AI-aided development.

---

<details open>
<summary><h2>✨ What Can This Thing Do?</h2></summary>

Glad you asked! Here's the good stuff:

- 📱 **NFC & QR Code Entry** — Guests tap an NFC tag or scan a QR code to open the guestbook instantly — no app download needed!
- 🧙 **Multi-Step Wizard** — A beautiful 4-step form guides guests through leaving their entry (Basics → Favorites → Fun Facts → Message)
- 📸 **Photo Upload with Compression** — Guests snap a selfie or upload a photo, automatically compressed client-side for fast uploads
- 🎨 **Polaroid-Style Cards** — Entries are displayed as gorgeous polaroid-style cards with handwritten fonts
- 🌙 **Dark Mode** — Full light/dark/system theme support with zero flash of unstyled content (FOUC)
- 🌍 **Multilingual** — English and German out of the box with `@nuxtjs/i18n`
- 🖥️ **Slideshow Mode** — Full-screen auto-advancing slideshow, perfect for displaying on a TV at your event
- 📄 **PDF Export** — Download your entire guestbook as a beautifully formatted PDF
- 🔐 **Admin Dashboard** — Password-protected admin panel for entry moderation (approve, reject, delete)
- 📊 **Entry Moderation** — Three-state system: pending → approved / rejected — keep your guestbook clean!
- 🔄 **Offline Support** — Entries are queued in IndexedDB when offline and synced when back online
- 📱 **PWA Ready** — Install as a Progressive Web App on any device
- 🐳 **Docker Support** — Ready-to-use Dockerfile and docker-compose for easy self-hosting

</details>

---

# 📱 How It Works

The magic is simple — here's the flow:

```
1. 📲 Guest taps NFC tag or scans QR code
         ↓
2. 🌐 Browser opens Tap & Tell (no app install!)
         ↓
3. 🧙 4-step wizard collects:
      Step 1: Name + Photo (required)
      Step 2: Favorites — color, food, movie, song, video (optional)
      Step 3: Fun Facts — superpowers, hidden talents, preferences (optional)
      Step 4: Personal Message (required)
         ↓
4. 💾 Entry saved with photo compression
         ↓
5. 🎉 Entry appears in the guestbook!
```

> [!NOTE]
> 📝 Steps 1 (Basics) and 4 (Message) are required. Steps 2 (Favorites) and 3 (Fun Facts) are completely optional — guests can skip them!

---

# 🚀 Getting Started

Ready to set up your own digital guestbook? Let's go! 🎉

## Prerequisites

- **Node.js** 18+ installed
- **pnpm** package manager (`npm install -g pnpm`)

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/Disane87/tap-and-tell.git
cd tap-and-tell

# 2. Install dependencies
pnpm install

# 3. Start the dev server
pnpm dev
```

That's it! Open `http://localhost:3000` and you're running! 🎉

## Environment Variables

Create a `.env` file in the project root:

```env
# PostgreSQL connection string
POSTGRES_URL=postgresql://user:password@localhost:5432/tapandtell

# JWT signing secret (CHANGE THIS in production!)
JWT_SECRET=your-jwt-secret-here

# CSRF token signing secret (CHANGE THIS in production!)
CSRF_SECRET=your-csrf-secret-here

# Master encryption key for photo encryption (64 hex chars, REQUIRED in production!)
ENCRYPTION_MASTER_KEY=

# Storage directory for entries and photos
DATA_DIR=.data
```

> [!CAUTION]
> ⚠️ **Security First!** Always set secure values for `JWT_SECRET`, `CSRF_SECRET`, and `ENCRYPTION_MASTER_KEY` in production!

---

# 🐳 Docker Deployment

Prefer containers? We've got you covered!

### Docker Compose (Recommended)

```bash
# Production
docker compose -f docker-compose.prod.yml up -d

# Development
docker compose up -d
```

### Standalone Docker

```bash
# Build the image
docker build -t tap-and-tell .

# Run the container
docker run -d \
  -p 3000:3000 \
  -e POSTGRES_URL=postgresql://user:password@host:5432/tapandtell \
  -e JWT_SECRET=your-secure-jwt-secret \
  -e CSRF_SECRET=your-secure-csrf-secret \
  -e ENCRYPTION_MASTER_KEY=your-64-char-hex-key \
  -v ./data:/app/.data \
  tap-and-tell
```

> [!IMPORTANT]
> 📂 Mount a volume to `/app/.data` to persist your guestbook entries and photos across container restarts!

---

# 📖 Pages & Features

Here's a tour of everything Tap & Tell offers:

## 🏠 Landing Page (`/`)

The main entry point for guests! Features:
- 🎠 **Swipeable Carousel** — Intro slide followed by existing entry slides
- 📝 **Bottom Sheet Wizard** — The 4-step form slides up from the bottom
- ⌨️ **Keyboard & Swipe Navigation** — Navigate entries with arrow keys or swipe gestures
- 📱 **NFC Context Detection** — Personalized welcome when entering via NFC tag
- 🔵 **Pagination Dots** — Visual indicators for carousel position

## 📖 Guestbook (`/guestbook`)

Browse all approved entries in a beautiful grid:
- 🔍 **Search by Name** — Debounced search (300ms) for instant filtering
- 🔄 **Sort Options** — Newest first or oldest first
- 📄 **PDF Export** — Download the entire guestbook as a formatted PDF
- 🖥️ **Slideshow Link** — Quick access to slideshow mode
- 👆 **Detail View** — Click any card to see the full entry in a bottom sheet

## 🖥️ Slideshow (`/slideshow`)

Perfect for displaying on a TV at your event!
- ▶️ **Auto-Advancing** — Configurable interval (3–30 seconds, default 8)
- ⏸️ **Play/Pause Controls** — Take control when you want
- 🖥️ **Fullscreen Mode** — True fullscreen for maximum impact
- ⌨️ **Keyboard Controls** — Arrow keys, Space, P (pause), F (fullscreen), ESC (exit)
- 👻 **Auto-Hide Controls** — Controls fade away during playback

## 🔐 Admin Dashboard (`/admin`)

Manage your guestbook with a password-protected admin panel:
- 📊 **Status Tabs** — Filter by All, Pending, Approved, Rejected
- ✅ **Bulk Actions** — Approve or reject multiple entries at once
- 🗑️ **Individual Management** — Delete or change status of single entries
- 🔢 **Entry Counts** — See counts per status at a glance
- 🚪 **Secure Logout** — Token-based session management

## 📱 QR Code Generator (`/admin/qr`)

Generate QR codes for your event:
- 🎯 **Custom Event Name** — Embed your event name in the URL
- 📥 **Download Options** — Export as PNG or SVG
- 📋 **Copy URL** — Quick copy to clipboard
- 🔗 **NFC-Compatible URLs** — Generates `?source=nfc&event=YourEvent` links

---

# 🏗️ Architecture

Let's peek under the hood! Here's how Tap & Tell is built:

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Nuxt 4.3 (SSR disabled — client-side SPA) |
| **UI Library** | Vue 3.5 with Composition API |
| **Styling** | Tailwind CSS v4 via `@tailwindcss/vite` |
| **Components** | shadcn-vue (headless UI) |
| **Language** | TypeScript 5.9 |
| **Icons** | Lucide Vue Next |
| **i18n** | @nuxtjs/i18n (EN + DE) |
| **PDF Generation** | jsPDF |
| **QR Codes** | qrcode |
| **Utilities** | VueUse |
| **Toasts** | vue-sonner |
| **PWA** | @vite-pwa/nuxt |
| **Package Manager** | pnpm |
| **Deployment** | Vercel / Docker |

## Project Structure

```
tap-and-tell/
├── app/                          # 🖥️ Nuxt client application
│   ├── pages/                    #    Route pages
│   ├── components/               #    Vue components
│   │   ├── form/                 #    Wizard form steps
│   │   └── ui/                   #    shadcn-vue base components
│   ├── composables/              #    Vue composables (state & logic)
│   ├── types/                    #    TypeScript type definitions
│   ├── plugins/                  #    Nuxt client plugins
│   ├── layouts/                  #    Page layouts
│   ├── lib/                      #    Utility functions
│   └── assets/                   #    Static assets (CSS, images)
│
├── server/                       # ⚙️ Nitro server
│   ├── routes/api/               #    API endpoints
│   │   ├── entries/              #    Public entry CRUD
│   │   ├── admin/                #    Protected admin endpoints
│   │   └── photos/               #    Photo serving
│   ├── utils/                    #    Server utilities (storage, auth)
│   └── types/                    #    Server type definitions
│
├── i18n/                         # 🌍 Internationalization
│   └── locales/                  #    EN + DE translation files
│
├── public/                       # 📂 Static public assets
│   └── icons/                    #    PWA icons
│
├── plans/                        # 📋 Development plan documents
├── nuxt.config.ts                # ⚙️ Nuxt configuration
├── package.json                  # 📦 Dependencies
└── tsconfig.json                 # 🔧 TypeScript config
```

## Storage Layer

Tap & Tell uses **PostgreSQL 16+** with Row-Level Security (RLS) for multi-tenant data isolation. Photos are stored on disk with **AES-256-GCM per-tenant encryption**.

```
PostgreSQL (via Drizzle ORM)
├── users, sessions, user_two_factor     # Auth & 2FA
├── tenants, tenant_members              # Multi-tenancy
├── guestbooks, entries                  # Core data (RLS-protected)
└── audit_logs, api_apps, api_tokens     # Security & API access

.data/photos/
├── [guestbookId]/[entryId].[ext]        # AES-256-GCM encrypted photos
└── ...
```

> [!NOTE]
> Photo storage is configurable via `STORAGE_DRIVER` (`local`, `vercel-blob`, or `s3`) and `DATA_DIR` (default: `.data/`).

---

# 🔌 API Reference

All API endpoints at a glance. Authenticated endpoints use HTTP-only JWT cookies with CSRF protection.

## Public — Guest Endpoints (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/g/[id]/info` | Guestbook info (name, settings, type) |
| `GET` | `/api/g/[id]/entries` | Approved entries for a guestbook |
| `POST` | `/api/g/[id]/entries` | Create a new guest entry (rate-limited) |
| `GET` | `/api/photos/[tenantId]/[filename]` | Serve encrypted photo |
| `GET` | `/api/health` | Health check endpoint |
| `GET` | `/api/og` | Locale-aware OG image (`?lang=de\|en`) |

## Authentication & Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login with email/password, set JWT cookies |
| `POST` | `/api/auth/register` | Register a new account |
| `POST` | `/api/auth/logout` | Clear auth cookies |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `GET` | `/api/auth/me` | Get current user profile |
| `PUT` | `/api/auth/me` | Update name and/or email |
| `DELETE` | `/api/auth/me` | Delete account (requires password) |
| `PUT` | `/api/auth/password` | Change password |
| `GET` | `/api/auth/csrf` | Get CSRF token |
| `POST` | `/api/auth/avatar` | Upload avatar (multipart, max 5 MB) |
| `DELETE` | `/api/auth/avatar` | Delete avatar |
| `GET` | `/api/auth/avatar/[userId]` | Serve avatar image (public) |

## Two-Factor Authentication (2FA)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/2fa/setup` | Start 2FA setup (returns QR code) |
| `POST` | `/api/auth/2fa/verify-setup` | Verify TOTP code to activate 2FA |
| `GET` | `/api/auth/2fa/status` | Check if 2FA is enabled |
| `POST` | `/api/auth/2fa/verify` | Verify 2FA code during login |
| `POST` | `/api/auth/2fa/disable` | Disable 2FA |
| `POST` | `/api/auth/2fa/resend` | Resend email OTP code |

## Tenant Management (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tenants` | List user's tenants |
| `POST` | `/api/tenants` | Create a new tenant |
| `GET` | `/api/tenants/[uuid]` | Get tenant details |
| `PUT` | `/api/tenants/[uuid]` | Update tenant settings |
| `DELETE` | `/api/tenants/[uuid]` | Delete tenant |
| `POST` | `/api/tenants/[uuid]/rotate-key` | Rotate encryption key |

## Guestbook Management (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tenants/[uuid]/guestbooks` | List guestbooks with entry counts |
| `POST` | `/api/tenants/[uuid]/guestbooks` | Create a new guestbook |
| `GET` | `/api/tenants/[uuid]/guestbooks/[gbUuid]` | Get guestbook details |
| `PUT` | `/api/tenants/[uuid]/guestbooks/[gbUuid]` | Update guestbook settings |
| `DELETE` | `/api/tenants/[uuid]/guestbooks/[gbUuid]` | Delete guestbook (cascades entries) |
| `POST` | `/api/tenants/[uuid]/guestbooks/[gbUuid]/header` | Upload header image |
| `DELETE` | `/api/tenants/[uuid]/guestbooks/[gbUuid]/header` | Delete header image |
| `POST` | `/api/tenants/[uuid]/guestbooks/[gbUuid]/background` | Upload background image |
| `DELETE` | `/api/tenants/[uuid]/guestbooks/[gbUuid]/background` | Delete background image |

## Entry Moderation (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tenants/[uuid]/guestbooks/[gbUuid]/entries` | All entries (admin view) |
| `PATCH` | `/api/tenants/[uuid]/guestbooks/[gbUuid]/entries/[id]` | Update entry status |
| `DELETE` | `/api/tenants/[uuid]/guestbooks/[gbUuid]/entries/[id]` | Delete an entry |
| `POST` | `/api/tenants/[uuid]/guestbooks/[gbUuid]/entries/bulk` | Bulk status update |

## Team Members (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tenants/[uuid]/members` | List team members |
| `POST` | `/api/tenants/[uuid]/members/invite` | Invite team member |
| `GET` | `/api/tenants/[uuid]/members/invites` | List pending invites |
| `DELETE` | `/api/tenants/[uuid]/members/invites/[id]` | Cancel invite |
| `DELETE` | `/api/tenants/[uuid]/members/[userId]` | Remove team member |
| `GET` | `/api/invites/[token]` | Get invite details (public) |
| `POST` | `/api/invites/accept` | Accept team invite (public) |

## API Apps & Tokens (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tenants/[uuid]/apps` | List API apps |
| `POST` | `/api/tenants/[uuid]/apps` | Create API app |
| `GET` | `/api/tenants/[uuid]/apps/[appId]` | Get API app details |
| `PUT` | `/api/tenants/[uuid]/apps/[appId]` | Update API app |
| `DELETE` | `/api/tenants/[uuid]/apps/[appId]` | Delete API app |
| `GET` | `/api/tenants/[uuid]/apps/[appId]/tokens` | List tokens |
| `POST` | `/api/tenants/[uuid]/apps/[appId]/tokens` | Create token |
| `DELETE` | `/api/tenants/[uuid]/apps/[appId]/tokens/[tokenId]` | Revoke token |
| `GET` | `/api/scopes` | List available API scopes |

## Analytics (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analytics/events` | Track analytics event |
| `GET` | `/api/tenants/[uuid]/analytics/overview` | Dashboard overview |
| `GET` | `/api/tenants/[uuid]/analytics/traffic` | Traffic analytics |
| `GET` | `/api/tenants/[uuid]/analytics/sources` | Traffic sources |
| `GET` | `/api/tenants/[uuid]/analytics/devices` | Device breakdown |
| `GET` | `/api/tenants/[uuid]/analytics/funnel` | Conversion funnel |

## Beta & Waitlist

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/beta/status` | Get current beta mode |
| `GET` | `/api/beta/validate` | Validate beta invite token |
| `POST` | `/api/waitlist/join` | Join the waitlist |
| `GET` | `/api/waitlist/status` | Check waitlist position |

### Quick Start Example

```bash
# Login
curl -X POST /api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "your-password"}'
# → Sets access_token and refresh_token cookies

# Create a guest entry (public, no auth)
curl -X POST /api/g/your-guestbook-id/entries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "message": "What an amazing event!",
    "photo": "data:image/jpeg;base64,..."
  }'
```

---

# 🧩 Composables

The brain of Tap & Tell lives in these composables — each one handles a specific concern:

| Composable | What It Does |
|-----------|-------------|
| `useAuth()` | 🔐 JWT cookie-based authentication (login, register, logout, profile) |
| `useGuests()` | 📋 CRUD operations for guestbook entries. Module-level shared state across the app |
| `useGuestForm()` | 🧙 4-step wizard state management with per-step validation |
| `useGuestbook()` | 📖 Public guestbook operations using flat `/api/g/[id]` endpoints |
| `useTenantAdmin()` | 👔 Admin entry operations (fetch all, delete, update status, bulk) |
| `useTheme()` | 🌙 Light/dark/system theme with localStorage persistence & FOUC prevention |
| `useNfc()` | 📱 Detects NFC context from URL query params (`?source=nfc&event=...`) |
| `useSlideshow()` | 🖥️ Auto-advancing slideshow with play/pause/fullscreen controls |
| `useEntryFilters()` | 🔍 Debounced search & sort for the guestbook page |
| `usePdfExport()` | 📄 Multi-page PDF generation with photos, favorites, and fun facts |
| `useImageCompression()` | 📸 Client-side image compression (max 1920px, target 500KB) |
| `useOfflineQueue()` | 🔄 IndexedDB-based offline entry queuing with auto-sync |

---

# 🎨 Theme System

Tap & Tell features a **3-layer theme initialization** to prevent any flash of unstyled content (FOUC):

```
Layer 1: Inline <script> in <head>
  └─ Runs BEFORE first paint
  └─ Reads localStorage, applies `dark` class to <html>
  └─ Zero visual flash! ⚡

Layer 2: Client Plugin (theme.client.ts)
  └─ Syncs reactive Vue state with DOM
  └─ Listens for system preference changes

Layer 3: <ClientOnly> Wrapper
  └─ ThemeToggle component only renders on client
  └─ Prevents SSR hydration mismatches
```

Toggle between **Light** ☀️, **Dark** 🌙, and **System** 💻 modes with a single click.

---

# 🌍 Internationalization

All user-facing text is translatable — no hardcoded strings anywhere!

| Feature | Details |
|---------|---------|
| **Languages** | 🇬🇧 English (default) + 🇩🇪 Deutsch |
| **Strategy** | No URL prefix, browser detection |
| **Persistence** | Cookie `i18n_locale` |
| **Module** | `@nuxtjs/i18n` |

Translation files live in `i18n/locales/` covering all scopes: form, guestbook, admin, navigation, slideshow, toasts, and more.

---

# 📱 NFC & QR Code Setup

Setting up NFC tags or QR codes for your event is easy!

## NFC Tags

1. Get writable NFC tags (NTAG215 or similar)
2. Use any NFC writer app to write the URL:
   ```
   https://your-domain.com/?source=nfc&event=YourEventName
   ```
3. Place tags at your event venue — guests tap and they're in! 📲

## QR Codes

1. Go to `/admin/qr` in your admin panel
2. Enter your event name
3. Download as PNG or SVG
4. Print and display at your venue! 🖨️

> [!TIP]
> 💡 **Pro tip**: Use both NFC tags AND QR codes! NFC for quick access, QR as a fallback for phones without NFC support.

---

# 📄 Data Model

Here's what a guest entry looks like under the hood:

```typescript
interface GuestEntry {
  id: string                    // UUID
  name: string                  // Guest's name
  message: string               // Personal message
  photoUrl?: string             // Photo path (e.g., /api/photos/{id}.jpg)
  answers?: GuestAnswers        // Optional form answers
  createdAt: string             // ISO 8601 timestamp
  status?: EntryStatus          // 'pending' | 'approved' | 'rejected'
  rejectionReason?: string      // Why entry was rejected
}

interface GuestAnswers {
  // 🎨 Favorites
  favoriteColor?: string
  favoriteFood?: string
  favoriteMovie?: string
  favoriteSong?: { title: string; artist?: string; url?: string }
  favoriteVideo?: { title: string; url?: string }

  // 🎭 Fun Facts
  superpower?: string
  hiddenTalent?: string
  desertIslandItems?: string
  coffeeOrTea?: 'coffee' | 'tea'
  nightOwlOrEarlyBird?: 'night_owl' | 'early_bird'
  beachOrMountains?: 'beach' | 'mountains'

  // 📖 Our Story
  howWeMet?: string
  bestMemory?: string
}
```

---

<details>
<summary><h2>⚡ Advanced Configuration</h2></summary>

### Image Compression Settings

Client-side image compression is applied automatically before upload:

| Setting | Value |
|---------|-------|
| Max dimension | 1920px |
| Target file size | 500KB |
| Initial JPEG quality | 0.8 |
| Minimum JPEG quality | 0.3 (adaptive) |

### PWA Configuration

Tap & Tell is a fully-configured Progressive Web App:

| Setting | Value |
|---------|-------|
| Display mode | Standalone |
| Orientation | Portrait |
| Theme color | Dark |
| Icon | SVG (any size, maskable) |
| Font caching | Google Fonts (1-year CacheFirst) |
| Offline | Navigate fallback to `/` |

### Server-Side Validation

Entries are validated server-side with these constraints:

| Field | Constraint |
|-------|-----------|
| `name` | Required, 1–100 characters |
| `message` | Required, 1–1000 characters |
| `photo` | Optional, max 7MB (base64) |

### Auth Token Details

| Property | Value |
|----------|-------|
| Algorithm | HMAC-SHA256 |
| Format | `base64(expiry).signature` |
| Expiry | 24 hours |
| Storage | `sessionStorage` (client) |
| Comparison | Timing-safe |

</details>

---

# 🛠️ Development

Want to contribute or customize? Here's how to get the development environment running:

## Commands

```bash
pnpm install              # Install dependencies
pnpm dev                  # Start development server (http://localhost:3000)
pnpm build                # Build for production
pnpm preview              # Preview production build locally
pnpm exec nuxi typecheck  # Run TypeScript type checking
```

## Key Architectural Decisions

Here are the "why"s behind the design:

| Decision | Reasoning |
|----------|-----------|
| **SSR Disabled** | Client-side SPA avoids hydration mismatches with localStorage, NFC APIs, and browser-only features |
| **Module-Level State** | Composables use module-level `ref()` instead of `useState()` to prevent SSR payload conflicts |
| **File-Based Storage** | Zero-config, portable, no database setup — perfect for event-specific deployments |
| **HMAC Tokens** | Stateless authentication with 24hr expiry — no session store needed |
| **Client-Side Compression** | Reduces upload size and server load — images compressed before sending |
| **IndexedDB Offline Queue** | Entries are never lost, even without internet — syncs automatically when back online |
| **3-Layer Theme Init** | Prevents FOUC completely — no flash between page load and theme application |

---

# 🤝 Contributing

Want to make Tap & Tell even better? That's awesome! 🎉

Here's how to get started:

1. 🍴 **Fork** the repository
2. 🌿 **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. 💻 **Make** your changes
4. ✅ **Build** to verify (`pnpm build`)
5. 📝 **Commit** with conventional commits (`feat: add amazing feature`)
6. 🚀 **Push** and open a Pull Request

### Guidelines

- 🔤 **Code comments & JSDoc** in English
- 🌍 **All user-facing text** must use i18n translation keys
- 🎨 **Styling** with Tailwind CSS utility classes
- 🧩 **UI components** follow shadcn-vue conventions
- ♿ **Accessibility** (a11y) best practices
- 📝 **TypeScript** — avoid `any` type
- 🔒 **Security** — no hardcoded secrets, validate at boundaries

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: resolve a bug
docs: update documentation
refactor: restructure code
style: formatting changes
test: add or update tests
chore: maintenance tasks
```

---

# 🔒 Security Notes

> [!CAUTION]
> **Before going to production, make sure to:**
> - 🔑 Set a secure `JWT_SECRET` (not the default)
> - 🔑 Set a secure `CSRF_SECRET` (not the default)
> - 🔑 Generate a 64-character hex `ENCRYPTION_MASTER_KEY` for photo encryption
> - 🔐 All admin features require 2FA (TOTP or Email OTP)

---

# 💡 Use Case Ideas

Here are some creative ways to use Tap & Tell:

- 💍 **Weddings** — Let guests leave their wishes and photos for the couple
- 🎂 **Birthday Parties** — Collect fun facts and memories from attendees
- 🏢 **Corporate Events** — Gather feedback and networking connections
- 🎓 **Graduations** — Classmates share their favorite memories
- 🎄 **Holiday Parties** — Guests share their holiday traditions and wishes
- 🏠 **Housewarming** — Visitors leave advice and well-wishes for the new home
- 🎸 **Concerts & Festivals** — Fans share their experience and favorite moments

---

# 🎉 That's a Wrap!

Thanks for checking out **Tap & Tell**! If you find it useful, give it a ⭐ on GitHub — it really helps! 🙌

Got a bug to report? Have an idea for a new feature? [Open an issue](https://github.com/Disane87/tap-and-tell/issues) and let's make this better together! 🚀

---

<p align="center">
  Made with ❤️ using <a href="https://nuxt.com/">Nuxt</a>, <a href="https://vuejs.org/">Vue</a>, and <a href="https://tailwindcss.com/">Tailwind CSS</a>
</p>
