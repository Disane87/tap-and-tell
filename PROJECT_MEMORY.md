# Project Memory

This document records important mistakes, fixes, and lessons learned
during development.

Claude must read this file before making changes
and avoid repeating documented issues.

---

## General Rules
- Do not reintroduce documented mistakes
- If a documented rule conflicts with a plan, ask before proceeding

---

## Known Issues & Fixes

### Hydration Mismatch: `useState` vs `ref` for Client-Only State
- **Problem**: `useTheme()` originally used `useState()` for theme state. Nuxt serializes `useState` values into the SSR payload. Server always sets `theme='system'` / `isDark=false`, but the client reads `localStorage` and gets different values, causing hydration mismatches.
- **Fix**: Replace `useState()` with a module-level `ref()` for theme state. Module-level `ref` is shared across the app on the client but never serialized into the SSR payload.
- **Rule**: Never use `useState()` for values that differ between server and client (e.g., localStorage, sessionStorage, browser APIs). Use plain `ref()` instead.

### Three-Layer Theme Initialisation
- **Problem**: Flash of unstyled content (FOUC) when using only a client plugin to apply the dark class.
- **Fix**: Use three layers: (1) inline `<script>` in `<head>` to apply `dark` class before first paint, (2) client-only Nuxt plugin (`theme.client.ts`) to sync reactive state before component mount, (3) `<ClientOnly>` wrapper on `ThemeToggle` to prevent SSR rendering of client-dependent UI.
- **Rule**: Always wrap components that depend on client-only state (theme, auth tokens, etc.) in `<ClientOnly>`.

### Missing TypeScript devDependency
- **Problem**: Build failed with `Failed to load TypeScript, which is required for resolving imported types`.
- **Fix**: `pnpm add -D typescript`
- **Rule**: Ensure `typescript` is listed as a devDependency when the project uses TypeScript.

### CSS `@import` Order Warning
- **Problem**: Google Fonts `@import url()` placed after `@theme` block caused `@import rules must precede all rules` warning.
- **Fix**: Removed CSS `@import` and loaded fonts via `<link>` tags in `nuxt.config.ts` head instead.
- **Rule**: Load external fonts via `<link>` preconnect/stylesheet, not CSS `@import`, when using Tailwind v4 `@theme`.

### Pre-existing Typecheck Errors
- **Issue**: `nuxi typecheck` reports ~40 errors in server files about missing `@types/node` globals (`process`, `Buffer`, `crypto`, `fs`, `path`).
- **Status**: Pre-existing, unrelated to theming. Likely needs `@types/node` installed or a `tsconfig.json` update.

### Public DELETE Endpoint
- **Issue**: `DELETE /api/entries/[id]` has no authentication. Any client can delete entries.
- **Status**: Known limitation. Admin panel uses authenticated `/api/admin/entries/[id]` for deletion. The public endpoint should be removed or auth-gated in a future pass.

### Default Admin Password
- **Issue**: `ADMIN_PASSWORD` defaults to `'admin123'` and `TOKEN_SECRET` defaults to `'tap-and-tell-secret'` when environment variables are not set.
- **Rule**: Always set `ADMIN_PASSWORD` and `TOKEN_SECRET` environment variables in production.

### Nuxt Component Auto-Import Naming in Subdirectories
- **Problem**: Components in subdirectories like `components/form/StepBasics.vue` are auto-imported with the directory as prefix: `FormStepBasics`, not `StepBasics`. Using the wrong name causes "Failed to resolve component" errors.
- **Fix**: Always use the full prefixed name when referencing components from subdirectories. E.g., `<FormStepBasics />` not `<StepBasics />`.
- **Rule**: Components in `components/foo/Bar.vue` must be referenced as `<FooBar />` in templates.

### Composable State Sharing Across Components
- **Problem**: When multiple components call `useMyComposable()` and the state (reactive/ref) is defined INSIDE the function, each component gets its own separate copy of state. This breaks shared state patterns like form wizards where multiple step components need to access the same data.
- **Fix**: Define state variables at MODULE LEVEL (outside the function) so they are shared across all calls.
- **Rule**: For composables that need shared state across components, always define `ref()` and `reactive()` at module level, not inside the composable function. See `useGuests`, `useTheme`, `useGuestForm` for examples.
