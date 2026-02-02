# Plan 37: MVP Beta Readiness

## Overview

This plan identifies all remaining gaps that must be addressed before launching the MVP beta (Phase 2: Hosted Beta from the release plan). It consolidates incomplete items from existing plans and adds new requirements discovered during the project review.

The MVP beta target: A stable, secure, hosted SaaS version that early adopters can use with confidence. Core guest flow, admin management, and security must work end-to-end without critical gaps.

---

## Priority Levels

- **P0 — Must Have**: Blocks beta launch. Without these, the product is broken or unsafe.
- **P1 — Should Have**: Significantly degrades the experience if missing. Should ship with beta.
- **P2 — Nice to Have**: Can follow shortly after beta launch.

---

## P0 — Must Have

### 37.1 CSRF Frontend Integration (from Plan 35.15)

- [ ] Create `app/plugins/csrf.client.ts` — fetch CSRF token on app init and attach to all mutating requests
- [ ] Ensure all `$fetch` POST/PUT/DELETE calls include the CSRF token header
- [ ] Verify CSRF protection works end-to-end (login, register, profile, entry creation, admin actions)

**Why**: Without this, CSRF protection is server-side only and the frontend cannot make mutating requests in production when CSRF enforcement is active.

**Status**: Server-side CSRF middleware and token endpoint exist. Frontend plugin partially implemented but not wired into all composables.

### 37.2 2FA Frontend — Login Verification (from Plan 35.35)

- [ ] Add 2FA verification step to the login flow in `app/pages/login.vue`
- [ ] After successful password auth, detect `requiresTwoFactor` response
- [ ] Show code input (6-digit TOTP or Email OTP)
- [ ] Support backup code fallback input
- [ ] Call `POST /api/auth/2fa/verify` with the code + temp token
- [ ] On success, proceed to dashboard; on failure, show error

**Why**: Backend 2FA enforcement exists. If a user enables 2FA, they cannot complete login without this UI.

### 37.3 2FA Frontend — Setup Page (from Plan 35.34)

- [ ] Create `app/pages/profile/security.vue` or add inline setup to profile page
- [ ] TOTP setup: Display QR code (from `POST /api/auth/2fa/setup`), verify with code
- [ ] Email OTP setup: Trigger email, verify with code
- [ ] Display backup codes after successful setup (one-time view, download option)
- [ ] Disable 2FA option with password confirmation
- [ ] Link from profile security section to setup flow

**Why**: Backend 2FA is fully implemented but there's no way for users to enable it without a frontend UI.

### 37.4 Error Pages

- [ ] Create `app/error.vue` — custom error page (404, 500, etc.)
- [ ] Friendly error message with navigation back to home
- [ ] Consistent with glassmorphism design system
- [ ] i18n support for error messages

**Why**: Default Nuxt error pages look broken and unprofessional. Users encountering bad URLs or server errors need a graceful experience.

### 37.5 Email Service Integration

- [ ] Implement actual email sending (currently `email-otp.ts` logs to console)
- [ ] Choose provider: Resend, Postmark, or SMTP via nodemailer
- [ ] Environment variable for email configuration (`EMAIL_FROM`, `SMTP_*` or `RESEND_API_KEY`)
- [ ] Email templates: 2FA OTP code, team invite, password reset (future)
- [ ] Graceful fallback: log to console in development, fail loudly in production if not configured

**Why**: 2FA email OTP and team invites cannot work without actual email delivery. Console logging is dev-only.

### 37.6 Deployment Configuration (from Plan 14)

- [ ] Create `vercel.json` with Nuxt preset configuration
- [ ] Configure environment variables in Vercel dashboard (document which ones)
- [ ] Configure PostgreSQL connection (Vercel Postgres or external)
- [ ] Configure persistent storage for avatars and photos (Vercel Blob or S3)
- [ ] Document deployment steps in README or dedicated docs
- [ ] Verify production build works on Vercel

**Why**: No deployment configuration exists. Cannot launch a hosted beta without it.

---

## P1 — Should Have

### 37.7 Basic Test Infrastructure (from Plan 13)

- [ ] Install vitest and @vue/test-utils
- [ ] Configure vitest for Nuxt (`vitest.config.ts`)
- [ ] Write unit tests for critical server utilities:
  - `server/utils/sanitize.ts`
  - `server/utils/rate-limit.ts`
  - `server/utils/password-policy.ts`
  - `server/utils/totp.ts`
  - `server/utils/csrf.ts`
- [ ] Write unit tests for critical composables:
  - `useAuth` (login, logout, token refresh flow)
  - `useGuestForm` (validation, step navigation, submit data assembly)
- [ ] Add `pnpm test` script to package.json
- [ ] CI: Run tests on PR (GitHub Actions workflow)

**Why**: No automated tests exist. Critical auth and security utilities need coverage before real users interact with them.

### 37.8 Production Environment Hardening

- [ ] Ensure all dev-only defaults are rejected in production:
  - `JWT_SECRET` must not be the insecure default
  - `ENCRYPTION_MASTER_KEY` must not be the dev fallback
  - `CSRF_SECRET` must not be the insecure default
  - `ADMIN_PASSWORD` must not be `admin123`
- [ ] Add startup validation: refuse to start in production with insecure defaults
- [ ] Configure proper CORS for production domain
- [ ] Ensure `Secure` cookie flag is enforced in production (HTTPS only)

**Why**: Insecure defaults shipping to production would be a critical security incident.

### 37.9 File Storage for Production

- [ ] Abstract photo/avatar storage behind a storage interface
- [ ] Implement S3-compatible storage adapter (Vercel Blob, AWS S3, MinIO)
- [ ] Environment-based storage selection: local filesystem (dev) vs cloud (prod)
- [ ] Migrate `server/utils/storage.ts` to use the abstraction
- [ ] Update avatar endpoints to use the abstraction

**Why**: Local `.data/` filesystem storage doesn't work on serverless platforms (Vercel). Photos and avatars would be lost on redeploy.

### 37.10 Loading States & Skeleton UI

- [ ] Add skeleton loading states to:
  - Dashboard / tenant admin page
  - Guestbook entry list (`/g/[id]/view`)
  - Profile page sections
- [ ] Ensure all async data fetches show loading indicators
- [ ] Add empty states for lists with no data (no guestbooks, no entries, no members)

**Why**: Currently many pages show blank content during data loading, which feels broken.

### 37.11 Form Validation Feedback

- [ ] Add inline validation errors to registration form (password policy feedback)
- [ ] Add inline validation errors to profile edit forms
- [ ] Show password strength indicator on registration
- [ ] Validate email format client-side before submission

**Why**: Users get generic toast errors but no field-level feedback about what's wrong.

### 37.12 Mobile Navigation Polish

- [ ] Verify UserMenu dropdown works correctly on mobile (touch targets, positioning)
- [ ] Ensure profile page is fully responsive on small screens
- [ ] Test guestbook admin settings dialog on mobile
- [ ] Verify form wizard step navigation on mobile

**Why**: NFC-based entry happens on mobile phones. The mobile experience must be smooth.

---

## P2 — Nice to Have

### 37.13 Legacy Admin Cleanup

- [ ] Remove or hide `/admin/login` and `/admin` legacy routes
- [ ] Remove `useAdmin` composable if no longer needed
- [ ] Remove legacy Bearer token auth endpoints (`POST /api/admin/login`, etc.)
- [ ] Clean up any references to legacy admin in codebase

**Why**: Legacy admin coexists with the new JWT-based tenant system. Keeping both is confusing and increases attack surface.

### 37.14 Docker Deployment Verification (from Plan 25)

- [ ] Test Docker Compose setup end-to-end with PostgreSQL
- [ ] Verify photo storage volumes persist across container restarts
- [ ] Document required environment variables in docker-compose.yml
- [ ] Add health check verification

**Why**: Docker files exist but have never been tested. Self-hosted users need a working setup.

### 37.15 Monitoring & Observability

- [ ] Add structured logging (JSON format for production)
- [ ] Add request ID tracking through the request lifecycle
- [ ] Consider Sentry or similar for error tracking
- [ ] Add basic metrics endpoint (entry count, user count)

**Why**: Operating a beta without visibility into errors and usage makes debugging impossible.

### 37.16 Rate Limit Persistence

- [ ] Current rate limiting is in-memory (resets on server restart)
- [ ] Consider Redis or database-backed rate limiting for production
- [ ] Or document the limitation and accept it for MVP

**Why**: In-memory rate limiting is fine for single-instance but doesn't survive restarts or scale to multiple instances.

### 37.17 Guestbook Sharing & Social

- [ ] Add share buttons (copy link, WhatsApp, email) to guestbook landing page
- [ ] Add Open Graph meta tags for guestbook preview when shared
- [ ] Generate social preview image or use guestbook theme color

**Why**: Guestbooks are shared socially. Good OG previews increase engagement.

---

## Implementation Order

1. **37.1** CSRF frontend (unblocks all mutating requests in prod)
2. **37.5** Email service (unblocks 2FA and invites)
3. **37.2** 2FA login verification UI
4. **37.3** 2FA setup page
5. **37.4** Error pages
6. **37.8** Production environment hardening
7. **37.9** File storage abstraction
8. **37.6** Deployment configuration
9. **37.7** Test infrastructure
10. **37.10** Loading states
11. **37.11** Form validation
12. **37.12** Mobile polish
13. **37.13–37.17** P2 items as time permits

---

## Exit Criteria for MVP Beta

- [ ] All P0 items completed and verified
- [ ] All P1 items completed or explicitly deferred with documented workarounds
- [ ] `pnpm build` passes
- [ ] Production deployment works (Vercel or Docker)
- [ ] Core flow works: Register → Create Tenant → Create Guestbook → Guest submits entry → Admin moderates → View/Slideshow
- [ ] Security: CSRF, 2FA, rate limiting, password policy all functional end-to-end
- [ ] No insecure defaults in production
- [ ] Basic test coverage for critical paths
