# Plan 42: Beta Access System

## Overview

This plan implements a two-phase beta launch strategy:

1. **Phase 1 — Private Beta**: Invite-only access for known contacts (friends, family, early supporters)
2. **Phase 2 — Public Closed Beta**: Public waitlist with prioritized batch invitations

The system controls who can register, tracks beta participants, and enables granting free/discounted plans to early adopters.

---

## Goals

- Block public registration until ready for general availability
- Enable invite-only registration via secure tokens
- Provide a public waitlist for interested users
- Track beta participants for future benefits (lifetime deals, discounts)
- Admin tools for managing invites and waitlist
- Smooth transition to public launch

---

## Priority Levels

- **P0 — Must Have**: Required for private beta launch
- **P1 — Should Have**: Required for public closed beta (waitlist)
- **P2 — Nice to Have**: Post-launch enhancements

---

## P0 — Private Beta (Invite-Only)

### 42.1 Database Schema: Beta Invites

- [x] Create `beta_invites` table in `server/database/schema.ts`:

```typescript
export const betaInvites = pgTable('beta_invites', {
  id: varchar('id', { length: 24 }).primaryKey(),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  source: text('source').notNull().default('manual'), // 'manual' | 'waitlist'
  grantedPlan: text('granted_plan').notNull().default('pro'), // plan on registration
  note: text('note'), // internal note: "Friend of X", "Speaker at Y"
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  acceptedByUserId: varchar('accepted_by_user_id', { length: 24 }).references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
```

- [x] Add index on `token` for fast lookup
- [x] Add index on `email` for duplicate checking
- [x] Run migration

### 42.2 Database Schema: User Beta Tracking

- [x] Extend `users` table with beta tracking fields:

```typescript
// Add to users table
betaInviteId: varchar('beta_invite_id', { length: 24 }).references(() => betaInvites.id),
isFounder: boolean('is_founder').notNull().default(false), // lifetime benefits
betaParticipant: boolean('beta_participant').notNull().default(false), // participated in beta
```

- [x] Extend `tenants` table with plan expiry:

```typescript
// Add to tenants table
planExpiresAt: timestamp('plan_expires_at', { withTimezone: true }), // null = never expires
planGrantedReason: text('plan_granted_reason'), // 'beta_invite' | 'founder' | 'purchase' | 'trial'
```

- [x] Run migration

### 42.3 Environment Configuration

- [x] Add `BETA_MODE` environment variable:
  - `'private'` — Only beta invite tokens accepted
  - `'waitlist'` — Waitlist open, registration still requires invite
  - `'open'` — Public registration enabled (post-launch)
- [x] Add to `.env.example` with documentation
- [x] Add to `server/utils/beta-config.ts`
- [x] Default to `'private'` in production if not set

### 42.4 Registration Gate

- [x] Modify `server/routes/api/auth/register.post.ts`:
  - [x] Check `BETA_MODE` environment variable
  - [x] If `'private'` or `'waitlist'`: require `betaToken` in request body
  - [x] Validate token exists, not expired, not already used
  - [x] On valid token: proceed with registration
  - [x] Mark invite as accepted (`acceptedAt`, `acceptedByUserId`)
  - [x] Copy `grantedPlan` to new tenant
  - [x] Set `betaParticipant: true` on user
  - [x] Set `isFounder: true` if invite has founder flag
  - [x] If `'open'`: allow registration without token (current behavior)

### 42.5 Beta Invite Validation Utility

- [x] Create `server/utils/beta.ts`:

```typescript
export async function validateBetaInvite(token: string): Promise<BetaInvite | null>
export async function acceptBetaInvite(token: string, userId: string): Promise<void>
export async function createBetaInvite(data: CreateBetaInviteInput): Promise<BetaInvite>
export async function isBetaModeEnabled(): boolean
export function getBetaMode(): 'private' | 'waitlist' | 'open'
```

### 42.6 Admin API: Beta Invite Management

- [x] Create `server/routes/api/admin/beta-invites/index.get.ts`:
  - List all beta invites (with pagination, filters)
  - Filter by: status (pending/accepted/expired), source, email search
  - Requires admin authentication

- [x] Create `server/routes/api/admin/beta-invites/index.post.ts`:
  - Create new beta invite
  - Body: `{ email, grantedPlan?, note?, expiresInDays?, isFounder? }`
  - Generate secure token (nanoid, 32 chars)
  - Default expiry: 30 days
  - Returns invite with token

- [x] Create `server/routes/api/admin/beta-invites/[id].delete.ts`:
  - Revoke/delete an unused invite

- [x] Create `server/routes/api/admin/beta-invites/bulk.post.ts`:
  - Bulk create invites from email list
  - Body: `{ emails: string[], grantedPlan?, expiresInDays? }`

### 42.7 Admin Authentication

- [x] Create simple admin authentication mechanism:
  - Option A: Special admin user flag in database
  - Option B: `ADMIN_EMAILS` environment variable (comma-separated)
  - Option C: First registered user is admin
- [x] Create `server/middleware/admin-auth.ts` middleware
- [x] Protect all `/api/admin/*` routes

### 42.8 Registration UI Updates

- [x] Modify `app/pages/register.vue`:
  - [x] Check for `?token=xxx` query parameter
  - [x] If beta mode and no token: show "Invite Only" message with waitlist link
  - [x] If token present: validate via API, show email (pre-filled, read-only)
  - [x] If token invalid/expired: show error with waitlist link
  - [x] Add i18n keys for all beta-related messages

- [x] Create invite validation endpoint `server/routes/api/beta/validate.get.ts`:
  - Query param: `token`
  - Returns: `{ valid: boolean, email?: string, error?: string }`

### 42.9 Beta Invite Email (Optional for P0)

- [ ] Create email template for beta invites
- [ ] Send invite email when admin creates invite
- [ ] Include: personalized message, registration link with token, expiry date

---

## P1 — Public Closed Beta (Waitlist)

### 42.10 Database Schema: Waitlist

- [x] Create `waitlist` table:

```typescript
export const waitlist = pgTable('waitlist', {
  id: varchar('id', { length: 24 }).primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  useCase: text('use_case'), // "Wedding", "Corporate event", etc.
  source: text('source'), // "organic", "referral", "social", URL param
  referredByUserId: varchar('referred_by_user_id', { length: 24 }).references(() => users.id),
  referralCode: text('referral_code').unique(), // user's own referral code
  position: serial('position'), // auto-incrementing position
  priority: integer('priority').notNull().default(0), // higher = earlier invite
  status: text('status').notNull().default('waiting'),
  // 'waiting' | 'invited' | 'registered' | 'unsubscribed'
  invitedAt: timestamp('invited_at', { withTimezone: true }),
  registeredAt: timestamp('registered_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
```

- [x] Add indexes on `email`, `referralCode`, `status`, `priority`

### 42.11 Public Waitlist API

- [x] Create `server/routes/api/waitlist/join.post.ts`:
  - Public endpoint (no auth)
  - Body: `{ email, name?, useCase?, referralCode? }`
  - Rate limited by IP
  - Validate email format
  - Check for existing entry (idempotent)
  - If referral code provided: increment referrer's priority
  - Generate unique referral code for new entry
  - Return: `{ position, referralCode, alreadyRegistered? }`

- [x] Create `server/routes/api/waitlist/status.get.ts`:
  - Query: `?email=xxx` or `?code=xxx`
  - Return: `{ position, totalAhead, status, referralCode, referralCount }`

### 42.12 Waitlist Landing Page

- [x] Create `app/pages/waitlist.vue`:
  - Hero section explaining the beta
  - Email signup form
  - Optional: name, use case selection
  - Success state: show position, referral code, share buttons
  - Already registered: show status and referral stats
  - i18n support (DE/EN)

- [x] Add link to waitlist from:
  - Registration page (when in beta mode)
  - Marketing landing page
  - 404/error pages

### 42.13 Referral System

- [x] Generate unique referral codes (e.g., `TAP-XXXX`)
- [x] Track referrals: when someone joins via referral code
- [x] Priority boost: +10 priority per successful referral
- [x] Show referral stats on waitlist status page
- [ ] Consider: bonus for referrer when referee registers

### 42.14 Admin Waitlist Management

- [x] Create `server/routes/api/admin/waitlist/index.get.ts`:
  - List waitlist entries with pagination
  - Filter by: status, priority range, date range
  - Sort by: position, priority, createdAt
  - Search by email/name

- [x] Create `server/routes/api/admin/waitlist/invite.post.ts`:
  - Batch invite from waitlist
  - Body: `{ count: number, minPriority?: number }` or `{ ids: string[] }`
  - Creates beta invites for selected entries
  - Updates waitlist status to 'invited'
  - Sends invite emails

- [x] Create `server/routes/api/admin/waitlist/[id].patch.ts`:
  - Update priority manually (VIP boost)
  - Update status

### 42.15 Admin Dashboard UI

- [ ] Create `app/pages/admin/beta.vue`:
  - Tabs: Invites | Waitlist | Stats
  - **Invites Tab**:
    - Create single invite form
    - Bulk invite textarea (email list)
    - Invite list with status, actions
  - **Waitlist Tab**:
    - Waitlist table with filters
    - Batch invite button
    - Priority adjustment
  - **Stats Tab**:
    - Total signups, invites sent, conversions
    - Signups over time chart
    - Top referrers

---

## P2 — Nice to Have

### 42.16 Waitlist Position Updates

- [ ] Send email when position improves significantly
- [ ] Send email when invited from waitlist
- [ ] Weekly digest: position update, referral stats

### 42.17 Early Adopter Benefits Tracking

- [ ] Track beta participant milestones:
  - First 100 users: "Pioneer" badge
  - First 500 users: "Early Adopter" badge
- [ ] Store badge/benefit info in user profile
- [ ] Display on profile page

### 42.18 Founder Lifetime Deals

- [ ] `isFounder` flag grants permanent Pro plan
- [ ] Skip plan expiry checks for founders
- [ ] Display "Founder" badge on profile
- [ ] Admin tool to grant/revoke founder status

### 42.19 Beta Feedback Collection

- [ ] In-app feedback widget for beta users
- [ ] Link to feedback form/Discord
- [ ] Track feature requests from beta users

### 42.20 Transition to Public Launch

- [ ] "Open gates" admin action:
  - Set `BETA_MODE=open`
  - Batch invite remaining waitlist
  - Send announcement emails
- [ ] Preserve beta participant benefits after launch
- [ ] Migration path for beta plans to paid plans

---

## API Route Summary

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/beta/validate` | GET | Public | Validate invite token |
| `/api/waitlist/join` | POST | Public | Join waitlist |
| `/api/waitlist/status` | GET | Public | Check waitlist status |
| `/api/admin/beta-invites` | GET | Admin | List invites |
| `/api/admin/beta-invites` | POST | Admin | Create invite |
| `/api/admin/beta-invites/bulk` | POST | Admin | Bulk create invites |
| `/api/admin/beta-invites/[id]` | DELETE | Admin | Revoke invite |
| `/api/admin/waitlist` | GET | Admin | List waitlist |
| `/api/admin/waitlist/invite` | POST | Admin | Batch invite from waitlist |
| `/api/admin/waitlist/[id]` | PATCH | Admin | Update waitlist entry |

---

## UI Pages Summary

| Page | Description |
|------|-------------|
| `/register?token=xxx` | Registration with beta token |
| `/waitlist` | Public waitlist signup |
| `/admin/beta` | Admin beta management dashboard |

---

## Environment Variables

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `BETA_MODE` | `private`, `waitlist`, `open` | `private` | Registration access mode |
| `ADMIN_EMAILS` | Comma-separated emails | — | Users with admin access |

---

## Implementation Order

### Phase 1: Private Beta (P0)
1. **42.1** Beta invites schema
2. **42.2** User beta tracking fields
3. **42.3** Environment configuration
4. **42.5** Beta validation utility
5. **42.4** Registration gate
6. **42.7** Admin authentication
7. **42.6** Admin API for invites
8. **42.8** Registration UI updates
9. **42.9** Invite emails (optional)

### Phase 2: Public Waitlist (P1)
10. **42.10** Waitlist schema
11. **42.11** Public waitlist API
12. **42.12** Waitlist landing page
13. **42.13** Referral system
14. **42.14** Admin waitlist API
15. **42.15** Admin dashboard UI

### Phase 3: Polish (P2)
16. **42.16–42.20** As time permits

---

## Exit Criteria

### Private Beta Ready
- [ ] Beta invites table exists with proper indexes
- [ ] Registration blocked without valid token (when `BETA_MODE=private`)
- [ ] Admin can create invites via API
- [ ] Invite tokens work end-to-end: create → email → register
- [ ] Invited users get correct plan (pro/founder)
- [ ] Beta participant flag set on registration

### Public Waitlist Ready
- [ ] Waitlist table exists
- [ ] Public can join waitlist
- [ ] Referral codes work and boost priority
- [ ] Admin can batch invite from waitlist
- [ ] Waitlist → invite → register flow works end-to-end

### Launch Ready
- [ ] `BETA_MODE=open` allows public registration
- [ ] All beta participants tracked for future benefits
- [ ] Founder lifetime deals work correctly
