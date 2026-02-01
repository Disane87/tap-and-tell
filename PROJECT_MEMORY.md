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

### Vue-i18n Special Characters
- **Problem**: The `@` character in i18n translation values (e.g. email placeholders) is interpreted as vue-i18n linked message syntax, causing build errors.
- **Fix**: Escape `@` using `{'@'}` syntax in JSON locale files: `"you{'@'}example.com"`.
- **Rule**: Always escape `@` characters in i18n locale values using `{'@'}`.

---

## Architecture Notes

For full architecture details, see:
- `CLAUDE.md` → Architecture (storage, API routes, composables, data flow, pages)
- `plans/26_tenant_system.md` → Multi-tenant data model, URL structure, migration
- `plans/27_user_registration.md` → Owner auth, user schema
- `plans/27b_roles_and_permissions.md` → 3-role system, permission matrix, invite flow

### Key Decisions (not documented elsewhere)
- **nanoid instead of UUID**: All `randomUUID()` calls replaced with `nanoid(12)` via `server/utils/id.ts`. 12-character URL-safe strings. Backward-compatible — existing UUIDs in DB remain valid. Migration file uses `nanoid` directly (no Nitro auto-imports).
- **Legacy compatibility**: `/` is now a marketing page (no longer guest form). Root-level `/guestbook` and `/slideshow` routes removed. `createEntry()` requires `guestbookId` as first parameter. `getDefaultTenantId()` returns first tenant for legacy routes. Legacy admin auth (Bearer tokens) still works for `/admin` pages.
- **`verifyTenantOwnership()`**: Deprecated, replaced by `canPerformAction()`.

---

## Security Hardening (Plan 35)

### PostgreSQL + RLS (Plan 33)
- **Database**: Migrated from SQLite/Turso to PostgreSQL with `pg` (node-postgres).
- **RLS**: All tenant-scoped tables use `FORCE ROW LEVEL SECURITY`. Tenant context set via `SET LOCAL app.current_tenant_id` per transaction.
- **Photo Encryption**: AES-256-GCM with HKDF-SHA256 per-tenant key derivation. File format: `[1B version][12B IV][16B auth tag][ciphertext]`.

### Rate Limiting
- **In-memory sliding window** rate limiters for login (5/15min), register (3/24h), entry creation (10/h), admin login (5/15min).
- **Account lockout**: 30 min lockout after 10 consecutive failed login attempts per email (in-memory).
- All rate limiters defined in `server/utils/rate-limit.ts`, lockout in `server/utils/account-lockout.ts`.

### Security Headers
- Middleware `server/middleware/security-headers.ts` sets CSP, HSTS (production only), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- CSP allows `'unsafe-inline'` for scripts/styles (required by Nuxt SPA + Tailwind).

### Input Sanitization
- `server/utils/sanitize.ts`: HTML tag stripping, text sanitization, recursive answer sanitization, photo magic byte validation (JPEG/PNG/WebP/HEIC).
- Applied to all entry creation and tenant/guestbook name endpoints.

### CSRF Protection
- Double-submit cookie pattern via `server/utils/csrf.ts` and `server/middleware/csrf.ts`.
- Token endpoint: `GET /api/auth/csrf`. Excluded: auth routes, public entry submission, legacy admin.
- **Rule**: Frontend must fetch CSRF token and include it as `x-csrf-token` header on all mutating authenticated requests.

### Audit Logging
- `audit_logs` table (RLS-protected, supports null tenant_id for global events).
- `server/utils/audit.ts`: `recordAuditLog(event, action, options)` — never blocks main request.
- All critical actions logged: login, logout, register, entry CRUD, tenant CRUD, guestbook CRUD, member management, 2FA changes, key rotation.

### JWT Hardening
- **Access tokens**: 15-minute expiry, stateless (JWT verification only, no DB lookup).
- **Refresh tokens**: 7-day expiry, stored in `sessions.token` column, DB-validated.
- **Auto-refresh**: Auth middleware transparently refreshes access tokens using refresh token.
- **Session revocation**: `deleteAllUserSessions(userId)` for password changes.
- **Cookie flags**: `HttpOnly`, `Secure` (production), `SameSite=Strict`, `Path=/`.

### Password Policy
- `server/utils/password-policy.ts`: Min 12 chars, uppercase, lowercase, digit, special char, common password check.
- Applied to registration. Must also apply to future password-change endpoints.

### Two-Factor Authentication (2FA)
- **Methods**: TOTP (authenticator app) and email OTP.
- **Tables**: `user_two_factor` (config), `two_factor_tokens` (temporary login tokens).
- **Endpoints**: `POST /api/auth/2fa/setup`, `POST /api/auth/2fa/verify-setup`, `POST /api/auth/2fa/verify`, `POST /api/auth/2fa/disable`, `GET /api/auth/2fa/status`.
- **Login flow**: Password → check 2FA → if enabled: return temp token + method, client sends code → `POST /api/auth/2fa/verify` → full session created.
- **Backup codes**: 10 codes generated on setup, bcrypt-hashed, one-time use.
- **Enforcement**: `server/middleware/2fa-enforce.ts` blocks access to `/api/tenants/*` and `/api/entries/*` for users without 2FA.
- **TOTP**: RFC 6238, HMAC-SHA1, 6 digits, 30s period, ±1 window. Pure Node.js crypto (no external deps).
- **Email OTP**: 6-digit code, 10-min expiry, 3 max attempts. Logs to console in dev mode.
- **Rule**: All owner accounts must set up 2FA before accessing admin features.

### Encryption Key Rotation
- `POST /api/tenants/[uuid]/rotate-key` — generates new salt, re-encrypts all photos, increments `key_version`.
- Backward-compatible: `decryptData` detects versioned (0x01 prefix) vs legacy format.
- **Rule**: Rotation is a heavy operation — avoid during peak usage.

### New Environment Variables
| Variable | Purpose | Default |
|---|---|---|
| `ENCRYPTION_MASTER_KEY` | 64-char hex key for photo encryption | Dev fallback (insecure) |
| `CSRF_SECRET` | CSRF token signing secret | `csrf-secret-change-in-production` |

### Important: All default secrets MUST be overridden in production
- `JWT_SECRET`, `ADMIN_PASSWORD`, `TOKEN_SECRET`, `ENCRYPTION_MASTER_KEY`, `CSRF_SECRET`
