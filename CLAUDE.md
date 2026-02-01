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
| 2FA | TOTP (RFC 6238) + Email OTP, mandatory for admin access |
| Encryption | AES-256-GCM per-tenant photo encryption (HKDF-SHA256) |
| i18n | @nuxtjs/i18n v10 |
| PWA | @vite-pwa/nuxt |
| PDF | jsPDF |
| QR Codes | qrcode |
| Notifications | vue-sonner |
| Utilities | @vueuse/core |
| Package Manager | pnpm |
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
| Dashboard | `/dashboard` |
| Tenant Admin | `/t/dev000tenant/admin` |
| Guest Form (GB1) | `/t/dev000tenant/g/dev00000gb01` |
| Guestbook (GB1) | `/t/dev000tenant/g/dev00000gb01/guestbook` |
| Moderation (GB1) | `/t/dev000tenant/g/dev00000gb01/admin` |
| QR Code (GB1) | `/t/dev000tenant/g/dev00000gb01/admin/qr` |
| Slideshow (GB1) | `/t/dev000tenant/g/dev00000gb01/slideshow` |

**Reset:** Delete `.data/data.db` and restart the dev server to re-seed from scratch.

## Architecture

### SSR is Disabled

`nuxt.config.ts` sets `ssr: false`. This is a client-side SPA. However, Nuxt still generates an SSR payload, so avoid `useState()` for values that differ between server and client (localStorage, browser APIs). Use plain `ref()` at module level instead.

### Storage Layer

SQLite database at `.data/data.db` with Drizzle ORM. Photos stored at `.data/photos/[guestbookId]/[entryId].[ext]`.

Storage logic lives in `server/utils/storage.ts`.

### Data Model

```
Tenant (name, plan, members)
  └── Guestbook 1 (type: permanent, settings, entries)
  └── Guestbook 2 (type: event, settings, date, entries)
```

### API Routes (`server/routes/api/`)

**Public (no auth):**
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

**Legacy Admin (Bearer token):**
- `POST /api/admin/login` — Authenticate with password
- `GET /api/admin/entries` — Fetch entries
- `DELETE /api/admin/entries/[id]` — Delete entry

### Key Composables (`app/composables/`)

- **`useGuestbooks`** — Guestbook CRUD for a tenant. Module-level `ref()` state.
- **`useTenantGuests(tenantId, guestbookId)`** — Public guest entry operations (fetch approved, create).
- **`useTenantAdmin(tenantId, guestbookId)`** — Admin entry operations (fetch all, delete, update status, bulk).
- **`useTenants`** — Tenant CRUD operations.
- **`useGuestForm`** — 4-step wizard state (Basics → Favorites → Fun → Message) with per-step validation.
- **`useAdmin`** — Token-based legacy admin auth using `sessionStorage`.
- **`useNfc`** — Detects NFC context from URL query params (`?source=nfc&event=EventName`).
- **`useTheme`** — Light/dark/system theme with `localStorage` persistence and FOUC prevention via inline head script.

### Data Flow

1. User visits `/t/[uuid]/g/[gbUuid]` (optionally via NFC tag with `?source=nfc&event=...`)
2. Multi-step wizard (`app/components/form/FormWizard.vue`) collects name, photo, answers, message
3. On submit → `useTenantGuests.createEntry()` → `POST /api/t/[uuid]/g/[gbUuid]/entries`
4. Server saves entry to database + photo file to `.data/photos/[guestbookId]/`
5. Guestbook page (`/t/[uuid]/g/[gbUuid]/guestbook`) displays approved entries via `GuestCard` components

### Pages

- `/` — Marketing landing page (hero, features, how it works)
- `/login` — Owner login
- `/register` — Owner registration
- `/dashboard` — Redirect to user's tenant admin (`/t/[uuid]/admin`), or create-tenant flow
- `/t/[uuid]` — Tenant root — redirects to first guestbook
- `/t/[uuid]/admin` — Tenant admin (guestbook list, members)
- `/t/[uuid]/g/[gbUuid]` — Guestbook guest form (multi-step wizard)
- `/t/[uuid]/g/[gbUuid]/guestbook` — Guestbook entries view
- `/t/[uuid]/g/[gbUuid]/slideshow` — Guestbook slideshow
- `/t/[uuid]/g/[gbUuid]/admin` — Guestbook admin (entry moderation)
- `/t/[uuid]/g/[gbUuid]/admin/qr` — Guestbook QR code generator
- `/admin/login` — Legacy admin login
- `/admin` — Legacy admin dashboard

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
| `ADMIN_PASSWORD` | Legacy admin password | `admin123` |
| `TOKEN_SECRET` | Legacy token signing secret | `tap-and-tell-secret` |
| `DATA_DIR` | Photo storage directory | `.data` |
| `NODE_ENV` | Environment mode | `development` |

> **All secret defaults MUST be overridden in production**: `JWT_SECRET`, `ENCRYPTION_MASTER_KEY`, `CSRF_SECRET`, `ADMIN_PASSWORD`, `TOKEN_SECRET`.

## Implementation Plans

Development follows sequential plans in `/plans/`. Plans 00-15 cover core features; 16-32 cover enhancements. Do not skip steps or invent features outside the plans.

- Mark completed steps with ✔ inside the plan file
- If new tasks arise, add them to an existing plan or create a new numbered plan file

## General Rules

### Communication
- **Respond in German** — all explanations, questions, and summaries should be in German
- **Code comments and JSDoc in English** — keep code documentation in English for consistency
- **Commit messages in English** — use conventional commit style in English

### Internationalization (i18n)
- **All user-facing text must be translatable** — never use hardcoded strings in components or pages. Use i18n translation keys (e.g., `$t('form.submit')`) for all labels, buttons, messages, placeholders, and error texts
- **Supported languages**: English (default) and German
- Use `@nuxtjs/i18n` for translation management

### Icons
- **Use Iconify** — prefer `@iconify/vue` for all icons. Access any icon set via Iconify (e.g., `lucide`, `heroicons`, `mdi`)

### Workflow
- **Present a plan before major changes** — for non-trivial features or refactors, outline the approach before implementing
- **Write tests proactively** — add unit/integration/e2e tests for new composables, utilities, and critical logic without being asked. Run tests and ensure they pass
- **Verify builds after changes** — run `pnpm build` after completing work to ensure no regressions
- **Plan execution order** — start with `plans/00_overview.md` and follow sequentially. Do not advance to the next plan until the current one is build-safe and the plan file has been updated
- **JSDoc is a blocker** — if documentation is missing or outdated, fix it before proceeding

## Process Rules

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

## Required Reading

Before doing any work, read these files (they are authoritative):
- `CLAUDE.md` — development rules, architecture, workflow (this file)
- `PRD.md` — product requirements, features, data model
- `PROJECT_MEMORY.md` — known issues, lessons learned, hard constraints
- `plans/*.md` — implementation plans (do not contradict them)

If something is unclear, ask before acting. If new features are added or changed, update the relevant docs accordingly.