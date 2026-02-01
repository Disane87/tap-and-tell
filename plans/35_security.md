# Plan 35: Comprehensive Security Hardening

## Overview

This plan covers all security hardening measures needed to make Tap & Tell production-ready for a paid SaaS product. It builds on the PostgreSQL RLS and per-tenant encryption from Plan 33.

## Steps

### Phase 1: Rate Limiting & Brute-Force Protection

- [x] **35.1** Create `server/utils/rate-limit.ts` — in-memory sliding window rate limiter with configurable limits per key (IP, user, endpoint) ✔
- [x] **35.2** Apply rate limiting to `POST /api/auth/login` — 5 attempts per IP per 15 minutes ✔
- [x] **35.3** Apply rate limiting to `POST /api/auth/register` — 3 registrations per IP per day ✔
- [x] **35.4** Apply rate limiting to public entry creation (`POST /api/t/[uuid]/g/[gbUuid]/entries`) — 10 entries per IP per hour ✔
- [x] **35.5** Apply rate limiting to legacy admin login (`POST /api/admin/login`) — 5 attempts per IP per 15 minutes ✔
- [x] **35.6** Implement account lockout — lock account for 30 min after 10 consecutive failed login attempts (in-memory) ✔

### Phase 2: Security Headers

- [x] **35.7** Create `server/middleware/security-headers.ts` — Nitro middleware that sets all security headers ✔
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (production only)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 0` (disabled in favor of CSP)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Content-Security-Policy` — restrict to self + Google Fonts CDN

### Phase 3: Input Sanitization & XSS Prevention

- [x] **35.8** Create `server/utils/sanitize.ts` — HTML tag stripper and input sanitizer ✔
- [x] **35.9** Apply sanitization to all entry creation endpoints (name, message, answers) ✔
- [x] **35.10** Add photo MIME type and magic byte validation on upload (JPEG, PNG, WebP, HEIC) ✔
- [x] **35.11** Sanitize tenant/guestbook names on creation and update ✔

### Phase 4: CSRF Protection

- [x] **35.12** Create `server/utils/csrf.ts` — generate and validate CSRF tokens (double-submit cookie pattern) ✔
- [x] **35.13** Create `server/middleware/csrf.ts` — validate CSRF token on mutating requests ✔
- [x] **35.14** Create `server/routes/api/auth/csrf.get.ts` — endpoint to fetch CSRF token ✔
- [ ] **35.15** Update frontend to include CSRF token in all mutating requests via composable

### Phase 5: Audit Logging

- [x] **35.16** Add `audit_logs` table to schema and migration — RLS-protected ✔
- [x] **35.17** Create `server/utils/audit.ts` — audit log helper functions ✔
- [x] **35.18** Add audit logging to all critical actions (15 routes) ✔

### Phase 6: JWT Hardening

- [x] **35.19** Implement token rotation — short-lived access tokens (15 min) + long-lived refresh tokens (7 days) ✔
- [x] **35.20** Create `POST /api/auth/refresh` endpoint for token refresh ✔
- [x] **35.21** Implement token revocation — `deleteAllUserSessions(userId)` ✔
- [x] **35.22** Enforce cookie flags: `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/` ✔

### Phase 7: Password Policy

- [x] **35.23** Create `server/utils/password-policy.ts` — password strength validation ✔
  - Minimum 12 characters, uppercase, lowercase, digit, special character
  - Common password check (embedded list)
- [x] **35.24** Apply password policy to registration endpoint ✔
- [ ] **35.25** Migrate from scrypt to Argon2id for password hashing (deferred — scrypt is acceptable)

### Phase 8: Two-Factor Authentication (2FA)

- [x] **35.26** Add `user_two_factor` and `two_factor_tokens` tables to schema and migration ✔
- [x] **35.27** Create `server/utils/totp.ts` — TOTP (RFC 6238), HMAC-SHA1, 6 digits, 30s, pure Node.js crypto ✔
- [x] **35.28** Create `server/utils/email-otp.ts` — 6-digit code, 10-min expiry, 3 max attempts ✔
- [x] **35.29** Create 2FA setup/disable/status endpoints ✔
- [x] **35.30** Create `POST /api/auth/2fa/verify` — verify 2FA code with backup code fallback ✔
- [x] **35.31** Generate 10 backup codes (scrypt-hashed) during 2FA setup ✔
- [x] **35.32** Modify login flow — password → 2FA check → temp token → code verification → session ✔
- [x] **35.33** Enforce 2FA requirement via `server/middleware/2fa-enforce.ts` ✔
- [ ] **35.34** Create frontend 2FA setup page (`/settings/security`) with QR code display
- [ ] **35.35** Create frontend 2FA verification step in login flow

### Phase 9: Encryption Key Rotation

- [x] **35.36** Add `key_version` column to tenants table (default 1) ✔
- [x] **35.37** Versioned encryption format: `[1B version][12B IV][16B auth tag][ciphertext]` ✔
- [x] **35.38** Create `POST /api/tenants/[uuid]/rotate-key` — re-encrypts all photos ✔
- [x] **35.39** Backward-compatible decryption (auto-detect versioned vs legacy format) ✔

### Phase 10: Verification & Cleanup

- [x] **35.40** Run `pnpm build` — passes without errors ✔
- [x] **35.41** Update `PROJECT_MEMORY.md` with new security features ✔
- [x] **35.42** Update `CLAUDE.md` with new environment variables and security documentation ✔

## Remaining (Frontend)

The following steps require frontend changes and are deferred:
- **35.15** CSRF token composable for frontend requests
- **35.34** 2FA setup page with QR code display and backup code download
- **35.35** 2FA verification UI in login flow
