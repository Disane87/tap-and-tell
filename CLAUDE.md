# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tap & Tell is an NFC-enabled digital guestbook application built with Nuxt 3. Guests tap their phone on an NFC tag, which opens the app where they can leave their name, photo, and a personal message via a multi-step wizard form.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 4.3 (SSR disabled, client-side SPA) |
| Language | TypeScript |
| UI Components | shadcn-vue / Radix Vue / Reka UI (under `app/components/ui/`) |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Icons | Iconify (`@iconify/vue`) / Lucide (`lucide-vue-next`) |
| Database | PostgreSQL 16+ with Row-Level Security (RLS) |
| ORM | Drizzle ORM (`drizzle-orm/node-postgres`) |
| Auth | JWT via jose (HTTP-only cookies, access + refresh tokens) |
| 2FA | TOTP (RFC 6238) + Email OTP, mandatory for admin access (skipped in dev mode) |
| Encryption | AES-256-GCM per-tenant photo encryption (HKDF-SHA256) |
| i18n | @nuxtjs/i18n v10 |
| PWA | @vite-pwa/nuxt |
| PDF | jsPDF |
| QR Codes | qrcode |
| Notifications | vue-sonner |
| Utilities | @vueuse/core |
| Package Manager | pnpm |
| Design System | Glassmorphism (see `DESIGN_SYSTEM.md`) |
| Deployment | Vercel (primary), Docker (self-hosted) |

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start development server (HTTPS, self-signed cert)
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm exec nuxi typecheck  # Type check
```

### Dev Server

The dev server runs over **HTTPS** (`https://localhost:3000`) using a self-signed certificate via `@vitejs/plugin-basic-ssl`. The browser will show a certificate warning on first visit — this is expected.

### Dev Tenant (Auto-Seeded)

On startup in development mode (`NODE_ENV !== 'production'`), a dev tenant is automatically created via `server/database/seed-dev.ts`. This is **idempotent** — it only runs if the dev user does not yet exist.

| Item | Value |
|---|---|
| **Email** | `dev@tap-and-tell.local` |
| **Password** | `dev123` |
| **Tenant ID** | `dev000tenant` |
| **Tenant Name** | Dev Guestbook (All Features) |

**Guestbooks:** Two guestbooks are created:
- `dev00000gb01` — "Welcome Home" (permanent, moderation on, theme `#6366f1`)
- `dev00000gb02` — "Silvester 2025" (event, moderation off, theme `#f59e0b`)

**Sample Entries:** 4 entries pre-seeded in guestbook 1 (2× approved, 1× pending, 1× rejected) with various guest answers.

**Dev URLs:**

| Page | URL |
|---|---|
| Login | `/login` |
| Profile | `/profile` |
| Dashboard (Tenant Admin) | `/dashboard` |
| Guest Landing (flat) | `/g/dev00000gb01` |
| Guestbook View (flat) | `/g/dev00000gb01/view` |
| Slideshow (flat) | `/g/dev00000gb01/slideshow` |
| Guestbook Admin (flat) | `/g/dev00000gb01/admin` |

**Reset:** Drop and recreate the PostgreSQL database and restart the dev server to re-seed from scratch.

## Architecture

### SSR is Disabled

`nuxt.config.ts` sets `ssr: false`. This is a client-side SPA. However, Nuxt still generates an SSR payload, so avoid `useState()` for values that differ between server and client (localStorage, browser APIs). Use plain `ref()` at module level instead.

### Storage Layer

PostgreSQL 16+ database with Row-Level Security (RLS) via Drizzle ORM. Photos stored at `.data/photos/[guestbookId]/[entryId].[ext]` with AES-256-GCM per-tenant encryption. User avatars stored at `.data/avatars/[userId].[ext]` (unencrypted, publicly served).

Storage logic lives in `server/utils/storage.ts`. Database connection in `server/utils/drizzle.ts`.

### Dual Route Architecture

The app supports two parallel route structures for guest access:

**Flat routes (preferred for all guest + admin access):**
```
/g/[id]           → Guest landing page (swipeable entry view + form)
/g/[id]/view      → Guestbook entries grid
/g/[id]/slideshow → Full-screen slideshow
/g/[id]/admin     → Guestbook admin (moderation, settings, QR)
/g/[id]/admin/qr  → QR code generator page
```
Guests access guestbooks directly by ID — no tenant UUID exposed. The server resolves the tenant context internally via `server/utils/guestbook-resolver.ts`.

NFC tags and QR codes should use the flat `/g/[id]` URLs for simplicity.

> **Note:** All tenant-level page routes (`/t/[uuid]/*`) have been removed. Tenant management is now consolidated into `/dashboard`. The API routes (`/api/t/[uuid]/*`) remain for backwards compatibility.

### Data Model

```
User (email, name, avatarUrl, passwordHash)
  └── Tenant (name, plan, members)
       └── Guestbook 1 (type: permanent, settings, entries)
       └── Guestbook 2 (type: event, settings, date, entries)
```

**Key columns:**
- `users.avatar_url` — Optional avatar image URL (served via `/api/auth/avatar/[userId]`)
- `tenants.plan` — Current plan: `free` (default), `pro`, or `business`

### API Routes (`server/routes/api/`)

**Public — flat routes (no auth, preferred for sharing):**
- `GET /api/g/[id]/info` — Guestbook info (name, settings, type)
- `GET /api/g/[id]/entries` — Approved entries
- `POST /api/g/[id]/entries` — Create entry (rate-limited, sanitized)

**Public — tenant-scoped (no auth, legacy):**
- `GET /api/t/[uuid]/guestbooks` — List guestbooks for tenant
- `GET /api/t/[uuid]/g/[gbUuid]/info` — Guestbook info (name, settings)
- `GET /api/t/[uuid]/g/[gbUuid]/entries` — Approved entries
- `POST /api/t/[uuid]/g/[gbUuid]/entries` — Create entry

**Authenticated (JWT cookie):**
- `GET/POST /api/tenants` — List/create tenants
- `GET/PUT/DELETE /api/tenants/[uuid]` — Tenant CRUD
- `GET/POST /api/tenants/[uuid]/guestbooks` — List/create guestbooks
- `GET/PUT/DELETE /api/tenants/[uuid]/guestbooks/[gbUuid]` — Guestbook CRUD
- `GET /api/tenants/[uuid]/guestbooks/[gbUuid]/entries` — All entries (admin)
- `DELETE /api/tenants/[uuid]/guestbooks/[gbUuid]/entries/[id]` — Delete entry
- `PATCH /api/tenants/[uuid]/guestbooks/[gbUuid]/entries/[id]` — Update status
- `POST /api/tenants/[uuid]/guestbooks/[gbUuid]/entries/bulk` — Bulk status update

**Authenticated — Profile Management (JWT cookie):**
- `GET /api/auth/me` — Current user (id, email, name, avatarUrl)
- `PUT /api/auth/me` — Update name and/or email
- `DELETE /api/auth/me` — Delete account (requires password confirmation)
- `PUT /api/auth/password` — Change password (validates policy, invalidates sessions)
- `POST /api/auth/avatar` — Upload avatar (multipart, JPEG/PNG/WebP, max 5 MB)
- `DELETE /api/auth/avatar` — Delete avatar
- `GET /api/auth/avatar/[userId]` — Serve avatar image (public, no auth)

### Key Composables (`app/composables/`)

- **`useAuth`** — JWT cookie-based authentication (login, register, logout, fetchMe, token refresh, updateProfile, changePassword, deleteAccount, uploadAvatar, deleteAvatar). Module-level `ref()` state.
- **`useGuestbook`** — Simplified public guest operations using flat `/api/g/[id]` endpoints. Preferred for guest-facing pages.
- **`useGuestbooks`** — Guestbook CRUD for a tenant. Module-level `ref()` state.
- **`useTenantGuests(tenantId, guestbookId)`** — Public guest entry operations (tenant-scoped, legacy).
- **`useTenantAdmin(tenantId, guestbookId)`** — Admin entry operations (fetch all, delete, update status, bulk).
- **`useTenants`** — Tenant CRUD operations.
- **`useTenantMembers`** — Tenant member CRUD and invite operations.
- **`useApiApps`** — API app and token management per tenant.
- **`useGuestForm`** — 4-step wizard state (Basics → Favorites → Fun → Message) with per-step validation.
- **`useEntryFilters`** — Entry filtering and search logic for guestbook views.
- **`useImageCompression`** — Client-side photo compression before upload.
- **`usePdfExport`** — PDF generation and export for guestbook entries.
- **`useSlideshow`** — Slideshow state management (auto-advance, interval, controls).
- **`useNfc`** — Detects NFC context from URL query params (`?source=nfc&event=EventName`).
- **`useOfflineQueue`** — Offline entry queuing with automatic submission on reconnect.
- **`useTheme`** — Light/dark/system theme with `localStorage` persistence and FOUC prevention via inline head script.

### Data Flow

**Flat route flow (preferred for guests):**
1. User visits `/g/[id]` (via NFC tag or QR code, optionally with `?source=nfc&event=...`)
2. Multi-step wizard collects name, photo, answers, message
3. On submit → `useGuestbook.createEntry()` → `POST /api/g/[id]/entries`
4. Server resolves tenant via `guestbook-resolver.ts`, saves entry to database + encrypted photo
5. Guestbook page (`/g/[id]/view`) displays approved entries

**Legacy API flow (for backwards compatibility):**
The tenant-scoped API routes (`/api/t/[uuid]/g/[gbUuid]/*`) remain available for existing integrations. New implementations should use the flat routes.

### Pages

**Public guest pages (flat routes, preferred):**
- `/g/[id]` — Guestbook guest landing page (swipeable entry view + form sheet). Shows admin bar for authenticated owners.
- `/g/[id]/view` — Guestbook entries grid with search/filter/PDF export
- `/g/[id]/slideshow` — Full-screen auto-advancing slideshow

**Guestbook admin (flat routes):**
- `/g/[id]/admin` — Guestbook admin (entry moderation, settings dialog with live preview, QR code dialog)
- `/g/[id]/admin/qr` — Guestbook QR code generator page

**Marketing & auth:**
- `/` — Marketing landing page (hero, features, how it works)
- `/login` — Owner login
- `/register` — Owner registration
- `/accept-invite` — Team member invite acceptance

**Owner/admin:**
- `/profile` — User profile management (avatar, personal info, plan, security, account deletion)
- `/dashboard` — Tenant admin (guestbook list, members, API apps) or create-tenant flow if no tenant exists

### Key Header Components

- **`UserMenu.vue`** — Avatar-based dropdown menu in the header. Authenticated users see avatar (initials fallback) with dropdown containing profile link, dashboard link, language toggle, theme cycling, and logout. Unauthenticated users see login button with standalone language and theme toggles.
- **`LanguageSwitcher.vue`** — Toggles between EN/DE locales.
- **`ThemeToggle.vue`** — Cycles through light/dark/system themes.

### Key Admin Components (`app/components/admin/`)

- **`GuestbookSettings.vue`** — Settings editor panel (moderation, welcome message, theme color, background, card styling, fonts). Exposes `localSettings` via `defineExpose`.
- **`GuestbookPreview.vue`** — Live preview of landing card, reactively bound to settings. Used in two-column dialog layout.
- **`ColorPicker.vue`** — Color picker input component.
- **`BackgroundPicker.vue`** — Background image/color picker with upload support.
- **`AdminApiApps.vue`** — API app management (CRUD, token management).
- **`CreateTokenDialog.vue`** — Dialog for creating new API tokens with scope selection.
- **`ApiTokenList.vue`** — Token list with revoke functionality.
- **`TokenRevealDialog.vue`** — One-time token reveal dialog after creation.

### Key Server Utils

- **`guestbook-resolver.ts`** — Maps guestbook ID → tenant context for flat routes. Exports `resolveGuestbook(id)` and `resolveTenantFromGuestbook(id)`.
- **`storage.ts`** — Photo file I/O (read/write/delete).
- **`crypto.ts`** — AES-256-GCM encryption/decryption with HKDF-SHA256 per-tenant key derivation.
- **`sanitize.ts`** — HTML stripping, input sanitization, photo magic byte validation.
- **`rate-limit.ts`** — In-memory sliding window rate limiters.
- **`audit.ts`** — Non-blocking audit log recording.
- **`csrf.ts`** — Double-submit cookie CSRF protection.
- **`drizzle.ts`** — PostgreSQL connection pool, `useDrizzle()` and `withTenantContext()` for RLS.

### Server Plugins

- **`database.ts`** — Database initialization on startup.
- **`csp.ts`** — Content Security Policy headers (allows Google Fonts, Iconify, blob: workers in dev).

### Theme System (3-Layer Initialization)

1. Inline `<script>` in `<head>` (nuxt.config.ts) applies `dark` class before first paint
2. Client plugin (`app/plugins/theme.client.ts`) syncs reactive state
3. `<ClientOnly>` wraps `ThemeToggle` to prevent SSR rendering

### Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `POSTGRES_URL` | PostgreSQL connection string | – |
| `DATABASE_URL` | PostgreSQL connection string (fallback) | – |
| `JWT_SECRET` | Owner auth JWT signing secret | insecure default |
| `ENCRYPTION_MASTER_KEY` | 64-char hex key for photo encryption | dev fallback |
| `CSRF_SECRET` | CSRF token signing secret | insecure default |
| `DATA_DIR` | Photo storage directory | `.data` |
| `NODE_ENV` | Environment mode | `development` |

> **All secret defaults MUST be overridden in production**: `JWT_SECRET`, `ENCRYPTION_MASTER_KEY`, `CSRF_SECRET`.

## Implementation Plans

Development follows sequential plans in `/plans/`. Plans 00-15 cover core features; 16-32 cover enhancements. Do not skip steps or invent features outside the plans.

- Mark completed steps with ✔ inside the plan file
- If new tasks arise, add them to an existing plan or create a new numbered plan file

## General Rules

### Communication
- **Respond in German** — all conversational explanations, questions, and summaries should be in German
- **Technical documentation in English** — all `.md` files (plans, PRD, CLAUDE.md, DESIGN_SYSTEM.md, PROJECT_MEMORY.md), code comments, JSDoc, and API docs must be written in English
- **Commit messages in English** — use conventional commit style in English

### Commit Conventions & Semantic Release

This project uses **Semantic Release** for automated versioning. Commit messages determine the release type.

**Commit Format:**
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Commit Types & Changelog Emojis:**

| Type | Emoji | Release | Description |
|------|-------|---------|-------------|
| `feat` | ✨ | Minor | New feature |
| `fix` | 🐛 | Patch | Bug fix |
| `perf` | ⚡ | Patch | Performance improvement |
| `refactor` | ♻️ | Patch | Code refactoring (no feature/fix) |
| `revert` | ⏪ | Patch | Revert previous commit |
| `docs` | 📚 | None | Documentation only |
| `style` | 💄 | None | Code style (formatting, semicolons) |
| `test` | ✅ | None | Adding/updating tests |
| `build` | 📦 | None | Build system changes |
| `ci` | 👷 | None | CI/CD configuration |
| `chore` | 🔧 | None | Other changes (deps, tooling) |
| `security` | 🔒 | Patch | Security fixes |

**Breaking Changes (Major Release):**
```
feat(auth): change login API response format

BREAKING CHANGE: The login endpoint now returns { user, tokens } instead of { token }
```

**Examples:**
```bash
# Minor release (0.X.0)
feat(analytics): add traffic dashboard

# Patch release (0.0.X)
fix(api): resolve SQL parameter binding in analytics queries

# No release
docs: update API documentation
chore: update dependencies
```

**CI/CD Workflows:**
- `ci.yml` — Runs on all PRs: lint, typecheck, test, build, security audit
- `deploy.yml` — Deploys to Vercel (production only, triggered on main branch push or manual dispatch)
- `release.yml` — Runs semantic-release on main branch pushes

**GitHub Secrets Required:**
| Secret | Purpose |
|--------|---------|
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `GITHUB_TOKEN` | Auto-provided by GitHub |
| `CODECOV_TOKEN` | Optional: coverage reports |

### Internationalization (i18n)
- **All user-facing text must be translatable** — never use hardcoded strings in components or pages. Use i18n translation keys (e.g., `$t('form.submit')`) for all labels, buttons, messages, placeholders, and error texts
- **Supported languages**: English (default) and German
- Use `@nuxtjs/i18n` for translation management

### Icons
- **Use Iconify** — prefer `@iconify/vue` for all icons. Access any icon set via Iconify (e.g., `lucide`, `heroicons`, `mdi`)

### DRY Principles
- Avoid code duplication by creating reusable components, composables, and utilities
- Follow the DRY principle in both frontend and backend code. If you find yourself copying and pasting code, consider refactoring it into a shared function or component.
- For example, if you need to perform the same API call in multiple places, create a composable that encapsulates that logic instead of repeating it.
- In the backend, if you have similar database queries or operations, abstract them into helper functions or services.
- Abstracting common logic not only reduces code duplication but also makes maintenance easier. If a change is needed, you only have to update it in one place.
- Always look for opportunities to reuse existing code before writing new code. This leads to a cleaner, more maintainable codebase.
- When creating reusable components, ensure they are flexible and configurable via props to accommodate different use cases without modification.
- When writing utilities or helper functions, consider their potential reuse across different parts of the application and design them to be generic and adaptable.
- Regularly review the codebase for duplication and refactor as needed to maintain a clean architecture.
- Encourage a culture of code reuse and modular design within the development process to promote efficiency and maintainability.
- When in doubt, ask if a similar function or component already exists before creating new code.

### Workflow
- **Present a plan before major changes** — for non-trivial features or refactors, outline the approach before implementing
- **Write tests proactively** — add unit/integration/e2e tests for new composables, utilities, and critical logic without being asked. Run tests and ensure they pass
- **Verify builds after changes** — run `pnpm build` after completing work to ensure no regressions
- **Plan execution order** — start with `plans/00_overview.md` and follow sequentially. Do not advance to the next plan until the current one is build-safe and the plan file has been updated
- **JSDoc is a blocker** — if documentation is missing or outdated, fix it before proceeding

## Process Rules

### Database Changes (Critical)

When modifying the database schema, **always update both files**:

1. **`server/database/schema.ts`** — Drizzle schema definition (used by ORM at runtime)
2. **`server/database/migrate.ts`** — Raw SQL migrations (executed on server startup)

**Checklist for schema changes:**
- [ ] Add new columns/tables to `schema.ts`
- [ ] Add corresponding `CREATE TABLE IF NOT EXISTS` or `ALTER TABLE ADD COLUMN IF NOT EXISTS` to `migrate.ts`
- [ ] If table needs tenant isolation: add RLS policy in `migrate.ts`
- [ ] Add indexes for frequently queried columns
- [ ] Test locally with fresh database (`DROP DATABASE` + restart dev server)

**RLS Policy Template:**
```sql
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE new_table FORCE ROW LEVEL SECURITY;
-- Then create policy via createPolicy() helper in migrate.ts
```

> **Warning:** Forgetting to update `migrate.ts` causes runtime errors in production because tables/columns won't exist!

### Environment Variables

- **New environment variables** — when introducing new ENV variables, always add them to both `.env.example` (with description and placeholder) and `.env` (with actual dev value)
- Read `PROJECT_MEMORY.md` before implementing changes — it contains known issues and hard constraints
- Verify the project builds (`pnpm build`) before marking any step complete
- Update relevant markdown plans/docs before implementing architectural changes
- Load external fonts via `<link>` tags, not CSS `@import` (Tailwind v4 `@theme` conflict)
- Wrap components depending on client-only state in `<ClientOnly>`
- Create reusable UI components under `app/components/ui/` following shadcn-vue conventions
- Use Tailwind CSS utility classes for styling; avoid custom CSS unless necessary
- Follow TypeScript best practices; avoid `any` type
- Write modular, reusable code; avoid duplication
- Ensure accessibility (a11y) best practices are followed in all UI components
- Document API routes with JSDoc comments describing request/response formats
- All new features must be responsive and mobile-friendly

## Required Reading

Before doing any work, read these files (they are authoritative):
- `CLAUDE.md` — development rules, architecture, workflow (this file)
- `PRD.md` — product requirements, features, data model
- `PROJECT_MEMORY.md` — known issues, lessons learned, hard constraints
- `DESIGN_SYSTEM.md` — glassmorphism design system, component patterns, do's and don'ts
- `plans/*.md` — implementation plans (do not contradict them)

If something is unclear, ask before acting. If new features are added or changed, update the relevant docs accordingly.