# Plan 36: API Apps & Token System (GitHub-Style)

## Overview

Implement an API app/token system modeled after GitHub's approach. Users create "apps" scoped to a tenant, each app gets API tokens with configurable scopes. Third-party integrations authenticate via `Authorization: Bearer <token>` instead of cookies.

## Design

### Concepts

- **API App**: A named integration registered by a tenant owner. Has a description and is scoped to one tenant.
- **API Token**: A secret token belonging to an app. Multiple tokens per app supported (e.g. production, staging). Tokens are hashed (SHA-256) before storage — the plaintext is shown only once at creation.
- **Scopes**: Fine-grained permissions that control what an API token can do. Checked on every API request authenticated via Bearer token.

### Scopes

| Scope | Description | Grants |
|---|---|---|
| `entries:read` | Read guestbook entries | GET entries (approved + all) |
| `entries:write` | Create, update, delete entries | POST/PATCH/DELETE entries, bulk operations |
| `guestbooks:read` | Read guestbooks | GET guestbooks, guestbook info |
| `guestbooks:write` | Create, update, delete guestbooks | POST/PUT/DELETE guestbooks |
| `tenant:read` | Read tenant info | GET tenant details, members |
| `tenant:write` | Update tenant settings | PUT tenant |
| `members:read` | Read tenant members | GET members list |
| `members:write` | Manage members & invites | POST invite, DELETE member |
| `photos:read` | Read/decrypt photos | GET photo endpoints |

### Token Format

`tat_<40-char-random-hex>` (tat = tap-and-tell token)

- Prefix makes tokens easily identifiable (like `ghp_` for GitHub)
- 40 hex chars = 160 bits of entropy
- Stored as SHA-256 hash in DB (like GitHub)
- Plaintext shown ONCE at creation

### Authentication Flow

1. Client sends `Authorization: Bearer tat_abc123...`
2. Auth middleware detects `tat_` prefix → API token flow
3. Hash the token → look up in `api_tokens` table
4. If found + not expired + not revoked → load app + scopes
5. Set `event.context.apiApp` with app info, scopes, and tenant context
6. Route handlers check `event.context.apiApp.scopes` for required scope

### Differences from Cookie Auth

- API tokens bypass 2FA enforcement (2FA is verified at app creation time)
- API tokens bypass CSRF checks (stateless Bearer auth)
- API tokens are always scoped to exactly one tenant
- Rate limiting applies per IP (same as cookie auth)

## Steps

### Phase 1: Database Schema

- [x] **36.1** Add `api_apps` table to schema.ts ✔
- [x] **36.2** Add `api_tokens` table to schema.ts ✔
- [x] **36.3** Update migrate.ts with new tables + indexes + RLS policies ✔

### Phase 2: Core Utilities

- [x] **36.4** Create `server/utils/api-token.ts` — token generation, hashing, validation, scope checking ✔
- [x] **36.5** Define scope constants (`ALL_SCOPES`, `SCOPE_DESCRIPTIONS`) and validation helpers ✔

### Phase 3: Auth Integration

- [x] **36.6** Extend `server/middleware/auth.ts` to detect `Authorization: Bearer tat_*` ✔
- [x] **36.7** Update `server/middleware/csrf.ts` to skip CSRF for API token requests ✔
- [x] **36.8** Update `server/middleware/2fa-enforce.ts` to skip 2FA for API token requests ✔
- [x] **36.9** Create `requireScope(event, scope)` utility in api-token.ts ✔

### Phase 4: App Management API

- [x] **36.10** `POST /api/tenants/[uuid]/apps` — Create a new API app ✔
- [x] **36.11** `GET /api/tenants/[uuid]/apps` — List all apps for a tenant ✔
- [x] **36.12** `GET /api/tenants/[uuid]/apps/[appId]` — Get app details ✔
- [x] **36.13** `PUT /api/tenants/[uuid]/apps/[appId]` — Update app name/description ✔
- [x] **36.14** `DELETE /api/tenants/[uuid]/apps/[appId]` — Delete app (cascades tokens) ✔

### Phase 5: Token Management API

- [x] **36.15** `POST /api/tenants/[uuid]/apps/[appId]/tokens` — Create token (plaintext ONCE) ✔
- [x] **36.16** `GET /api/tenants/[uuid]/apps/[appId]/tokens` — List tokens (metadata only) ✔
- [x] **36.17** `DELETE /api/tenants/[uuid]/apps/[appId]/tokens/[tokenId]` — Revoke token ✔

### Phase 6: Scope Integration

- [x] **36.18** Add `requireScope()` to all 17 authenticated tenant routes ✔
- [x] **36.19** `GET /api/scopes` — public endpoint listing all available scopes ✔

### Phase 7: Verification

- [x] **36.20** `pnpm build` passes — 3.23 MB, no errors ✔
- [x] **36.21** Updated PROJECT_MEMORY.md ✔
- [x] **36.22** Plan complete ✔

## Remaining (Frontend)

- App management UI (create/list/delete apps)
- Token creation UI with scope selection checkboxes
- Token display modal (show plaintext once)
- API documentation page for external developers
