# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tap & Tell is an NFC-enabled digital guestbook application built with Nuxt 3. Guests tap their phone on an NFC tag, which opens the app where they can leave their name, photo, and a personal message via a multi-step wizard form.

## Tech Stack

- **Framework**: Nuxt 4.3 with SSR disabled (client-side SPA)
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- **Components**: shadcn-vue (headless UI, installed under `app/components/ui/`)
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Deployment**: Vercel

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

```
ADMIN_PASSWORD=...   # Admin login password (defaults to 'admin123' — change in prod)
TOKEN_SECRET=...     # HMAC signing secret (defaults to 'tap-and-tell-secret' — change in prod)
DATA_DIR=.data       # Storage directory path
```

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
- **Write tests proactively** — add unit tests for new composables, utilities, and critical logic without being asked
- **Verify builds after changes** — run `pnpm build` after completing work to ensure no regressions

## Process Rules

- Read `PROJECT_MEMORY.md` before implementing changes — it contains known issues and hard constraints
- Verify the project builds (`pnpm build`) before marking any step complete
- Update relevant markdown plans/docs before implementing architectural changes
- JSDoc is required on all functions, composables, utilities, and server handlers — describe intention, inputs, outputs, and side effects
- Load external fonts via `<link>` tags, not CSS `@import` (Tailwind v4 `@theme` conflict)
- Wrap components depending on client-only state in `<ClientOnly>`
- Create reusable UI components under `app/components/ui/` following shadcn-vue conventions
- Use Tailwind CSS utility classes for styling; avoid custom CSS unless necessary
- Follow TypeScript best practices; avoid `any` type
- Write modular, reusable code; avoid duplication
- Ensure accessibility (a11y) best practices are followed in all UI components
- Write unit tests for critical logic in composables and utilities
- Document API routes with JSDoc comments describing request/response formats

# Project rules for Claude Code when working on the Tap & Tell repository.
You MUST read the following files before doing any work:
- CLAUDE.md
- PRD.md
- PROMPT.md
- PROJECT_MEMORY.md
- plans/*.md

Treat them as authoritative.
Do not contradict them.
Ask before acting if something is unclear.

Failure to comply with these rules will result in immediate termination of your access to the repository.

# Important
- Always follow the instructions in CLAUDE.md and PRD.md.
- Do not make any changes that contradict the plans in the plans/ directory.
- If something is not specified in the plans, ask for clarification before proceeding.
- If new stuff is added/changed update PRD.md and CLAUDE.md and any relevant plan files accordingly.