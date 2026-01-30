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
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm exec nuxi typecheck  # Type check
```

## Architecture

### SSR is Disabled

`nuxt.config.ts` sets `ssr: false`. This is a client-side SPA. However, Nuxt still generates an SSR payload, so avoid `useState()` for values that differ between server and client (localStorage, browser APIs). Use plain `ref()` at module level instead.

### Storage Layer

No database — uses **file-based JSON storage** in `.data/` directory (configurable via `DATA_DIR` env var):
- `.data/entries.json` — Array of `GuestEntry` objects
- `.data/photos/` — Image files named `{entryId}.{ext}`

Storage logic lives in `server/utils/storage.ts`.

### API Routes (`server/routes/api/`)

**Public:**
- `GET /api/entries` — All entries (newest-first)
- `POST /api/entries` — Create entry (name, message, photo as base64, answers)
- `GET /api/entries/[id]` — Single entry
- `DELETE /api/entries/[id]` — Delete entry (unprotected — known issue)
- `GET /api/photos/[filename]` — Serve photo file

**Admin (Bearer token required):**
- `POST /api/admin/login` — Authenticate with password, returns HMAC-SHA256 token (24hr expiry)
- `GET /api/admin/entries` — Fetch entries
- `DELETE /api/admin/entries/[id]` — Delete entry

Auth logic in `server/utils/auth.ts`.

### Key Composables (`app/composables/`)

- **`useGuests`** — CRUD operations for entries. Module-level `ref()` state shared across app.
- **`useGuestForm`** — 4-step wizard state (Basics → Favorites → Fun → Message) with per-step validation. Steps 1 & 4 required, 2 & 3 optional.
- **`useAdmin`** — Token-based admin auth using `sessionStorage`.
- **`useNfc`** — Detects NFC context from URL query params (`?source=nfc&event=EventName`).
- **`useTheme`** — Light/dark/system theme with `localStorage` persistence and FOUC prevention via inline head script.

### Data Flow

1. User visits `/` (optionally via NFC tag with `?source=nfc&event=...`)
2. Multi-step wizard (`app/components/form/FormWizard.vue`) collects name, photo, answers, message
3. On submit → `useGuests.createEntry()` → `POST /api/entries`
4. Server saves entry JSON + photo file to `.data/`
5. Guestbook page (`/guestbook`) displays all entries via `GuestCard` components

### Pages

- `/` — Guest submission form (multi-step wizard)
- `/guestbook` — View all entries
- `/admin/login` — Admin password entry
- `/admin` — Admin dashboard (entry management)

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
