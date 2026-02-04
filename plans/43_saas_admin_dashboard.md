# Plan 43: SaaS Admin Dashboard

## Overview

A comprehensive internal admin dashboard for managing the entire SaaS platform, including customer management, system configuration, real-time analytics, and operational insights. This feature is **SaaS-only** and must not be included in CE (Community Edition) builds.

## Architecture: SaaS/CE Separation

### Nuxt Layer Approach

The SaaS admin functionality lives in a **separate private repository** that extends the OSS codebase:

```
# Public Repo: tap-and-tell (OSS/CE)
├── app/
├── server/
├── server/database/schema.ts      ← Core tables only
├── server/database/migrate.ts     ← Core migrations only
└── nuxt.config.ts

# Private Repo: tap-and-tell-saas
├── package.json                   ← depends on tap-and-tell
├── nuxt.config.ts                 ← extends: ['tap-and-tell']
└── layers/
    └── saas/
        ├── nuxt.config.ts
        ├── app/
        │   └── pages/
        │       └── _admin/        ← Super admin pages
        ├── server/
        │   ├── api/_admin/        ← Admin API routes
        │   ├── database/
        │   │   ├── schema-saas.ts ← SaaS-only tables
        │   │   └── migrate-saas.ts← SaaS-only migrations
        │   └── utils/
        │       └── saas/          ← SaaS-specific utilities
        └── composables/
            └── useSaasAdmin.ts
```

### Build Configuration

```typescript
// Private repo: nuxt.config.ts
export default defineNuxtConfig({
  extends: ['tap-and-tell'],

  // SaaS layer with admin features
  layers: ['./layers/saas'],

  // Environment marker
  runtimeConfig: {
    public: {
      edition: 'saas'
    }
  }
})
```

### Database Schema Separation

**Core schema (`server/database/schema.ts`)** - remains in OSS:
- users, sessions, tenants, guestbooks, entries
- tenantMembers, tenantInvites, auditLogs
- userTwoFactor, twoFactorTokens
- apiApps, apiTokens
- betaInvites, waitlist (needed for beta flow)
- analyticsEvents, analyticsDailyStats, analyticsSessions

**SaaS schema (`layers/saas/server/database/schema-saas.ts`)** - private repo only:
- saasConfig (global config like BETA_MODE)
- adminSessions (super admin sessions)
- revenueEvents (Stripe webhooks, payments)
- systemMetrics (live stats snapshots)
- adminNotifications (notification queue)
- loginEvents (detailed login tracking)

---

## Features

### 1. System Configuration

| Setting | Type | Description |
|---------|------|-------------|
| BETA_MODE | `private` / `waitlist` / `open` | Controls registration access |
| MAINTENANCE_MODE | boolean | Show maintenance page |
| REGISTRATION_ENABLED | boolean | Allow new registrations |
| MAX_FREE_GUESTBOOKS | number | Free plan limits |
| MAX_PRO_GUESTBOOKS | number | Pro plan limits |

**Storage**: `saas_config` table (key-value with JSON values)

### 2. Customer Management

#### Customer List View
- Sortable/filterable table of all users with `isAdmin = false`
- Columns: Email, Name, Plan, Tenants, Entries, Created, Last Login, Status
- Quick actions: Change plan, Send invite, Impersonate, Suspend

#### Customer Detail View
- Profile info (email, name, avatar, 2FA status)
- All tenants owned/member of
- All guestbooks across tenants
- Entry count, photo storage used
- Login history (last 30 days)
- Audit log for this user
- Revenue (if Stripe integrated)

#### Plan Management
- Change plan: free → pro → business
- Set expiration date
- Grant founder status
- Add plan notes

### 3. Invite System

#### Create Invite
- Email address (required)
- Plan to grant (free/pro/business)
- Founder status toggle
- Expiration date (default 7 days)
- Internal note

#### Invite List
- All pending/accepted/expired invites
- Resend invite
- Revoke invite
- Copy invite link

### 4. Analytics Dashboard

#### Real-Time Metrics (WebSocket/SSE)
- Active users on site (last 5 min)
- Active sessions by page
- Live entry submissions
- Current form fill rate

#### Historical Metrics
- Daily/weekly/monthly user registrations
- Login counts by day
- Active users (DAU/WAU/MAU)
- Country distribution (heatmap)
- Device breakdown
- Entry submissions over time

#### Business Metrics
- Total users by plan
- Conversion rate (free → paid)
- MRR/ARR (if Stripe)
- Churn rate
- Storage usage

### 5. Login Tracking

New table `login_events`:
```sql
CREATE TABLE login_events (
  id VARCHAR(24) PRIMARY KEY,
  user_id VARCHAR(24) REFERENCES users(id),
  success BOOLEAN NOT NULL,
  ip_address TEXT,
  country_code VARCHAR(2),
  city TEXT,
  user_agent TEXT,
  browser VARCHAR(50),
  os VARCHAR(50),
  device_type VARCHAR(20),
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 6. Notifications

#### Push Notifications (Web Push API)
- New user registration
- Plan upgrade/downgrade
- Failed payment (Stripe)
- High error rate alert
- Storage threshold alert

#### In-App Notification Center
- Bell icon with unread count
- List of recent events
- Mark as read/dismiss
- Notification preferences

### 7. System Health

- Database connection status
- Storage usage (photos)
- API response times (p50/p95/p99)
- Error rate (last hour)
- Background job status

---

## Database Schema (SaaS-only)

```typescript
// layers/saas/server/database/schema-saas.ts

/**
 * Global SaaS configuration (key-value store).
 */
export const saasConfig = pgTable('saas_config', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 24 }).references(() => users.id)
})

/**
 * Login events for analytics and security.
 */
export const loginEvents = pgTable('login_events', {
  id: varchar('id', { length: 24 }).primaryKey(),
  userId: varchar('user_id', { length: 24 }).references(() => users.id, { onDelete: 'set null' }),
  email: text('email').notNull(),
  success: boolean('success').notNull(),
  ipAddress: text('ip_address'),
  countryCode: varchar('country_code', { length: 2 }),
  city: text('city'),
  region: text('region'),
  userAgent: text('user_agent'),
  browser: varchar('browser', { length: 50 }),
  os: varchar('os', { length: 50 }),
  deviceType: varchar('device_type', { length: 20 }),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index('idx_login_events_user').on(table.userId),
  index('idx_login_events_created').on(table.createdAt),
  index('idx_login_events_country').on(table.countryCode)
])

/**
 * Revenue events from Stripe webhooks.
 */
export const revenueEvents = pgTable('revenue_events', {
  id: varchar('id', { length: 24 }).primaryKey(),
  userId: varchar('user_id', { length: 24 }).references(() => users.id, { onDelete: 'set null' }),
  tenantId: varchar('tenant_id', { length: 24 }).references(() => tenants.id, { onDelete: 'set null' }),
  eventType: varchar('event_type', { length: 50 }).notNull(), // subscription_created, payment_succeeded, etc.
  stripeEventId: varchar('stripe_event_id', { length: 100 }).unique(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 100 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 100 }),
  amountCents: integer('amount_cents'),
  currency: varchar('currency', { length: 3 }),
  plan: varchar('plan', { length: 20 }),
  interval: varchar('interval', { length: 10 }), // month, year
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index('idx_revenue_events_user').on(table.userId),
  index('idx_revenue_events_created').on(table.createdAt),
  index('idx_revenue_events_type').on(table.eventType)
])

/**
 * System metrics snapshots for dashboard.
 */
export const systemMetrics = pgTable('system_metrics', {
  id: varchar('id', { length: 24 }).primaryKey(),
  metricType: varchar('metric_type', { length: 50 }).notNull(),
  value: jsonb('value').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index('idx_system_metrics_type_time').on(table.metricType, table.createdAt)
])

/**
 * Admin notifications queue.
 */
export const adminNotifications = pgTable('admin_notifications', {
  id: varchar('id', { length: 24 }).primaryKey(),
  type: varchar('type', { length: 50 }).notNull(), // new_registration, plan_change, error_spike, etc.
  title: text('title').notNull(),
  body: text('body'),
  data: jsonb('data').$type<Record<string, unknown>>().default({}),
  read: boolean('read').notNull().default(false),
  pushedAt: timestamp('pushed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index('idx_admin_notifications_read').on(table.read),
  index('idx_admin_notifications_created').on(table.createdAt)
])

/**
 * Push notification subscriptions for admin users.
 */
export const adminPushSubscriptions = pgTable('admin_push_subscriptions', {
  id: varchar('id', { length: 24 }).primaryKey(),
  userId: varchar('user_id', { length: 24 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index('idx_admin_push_user').on(table.userId)
])
```

---

## API Routes (SaaS-only)

All routes require `users.isAdmin = true`.

```
# System Config
GET    /api/_admin/config              → Get all config
PUT    /api/_admin/config/:key         → Update config value

# Customers
GET    /api/_admin/customers           → List customers (paginated, sortable)
GET    /api/_admin/customers/:id       → Customer detail
PUT    /api/_admin/customers/:id/plan  → Change plan
POST   /api/_admin/customers/:id/suspend → Suspend user
DELETE /api/_admin/customers/:id       → Delete user (soft)

# Invites
GET    /api/_admin/invites             → List invites
POST   /api/_admin/invites             → Create invite
DELETE /api/_admin/invites/:id         → Revoke invite
POST   /api/_admin/invites/:id/resend  → Resend invite email

# Analytics
GET    /api/_admin/analytics/realtime  → SSE stream for live data
GET    /api/_admin/analytics/summary   → Dashboard summary
GET    /api/_admin/analytics/logins    → Login history
GET    /api/_admin/analytics/countries → Country breakdown
GET    /api/_admin/analytics/revenue   → Revenue metrics

# Notifications
GET    /api/_admin/notifications       → List notifications
PUT    /api/_admin/notifications/:id   → Mark as read
POST   /api/_admin/push/subscribe      → Subscribe to push
DELETE /api/_admin/push/subscribe      → Unsubscribe

# System
GET    /api/_admin/health              → System health check
GET    /api/_admin/metrics             → Prometheus-style metrics
```

---

## Pages (SaaS-only)

```
app/pages/_admin/
├── index.vue           → Dashboard overview (widgets)
├── customers/
│   ├── index.vue       → Customer list
│   └── [id].vue        → Customer detail
├── invites.vue         → Invite management
├── analytics.vue       → Full analytics view
├── config.vue          → System configuration
├── notifications.vue   → Notification center
└── health.vue          → System health
```

---

## Implementation Steps

### Phase 1: Architecture Setup
- [ ] 1.1 Create private `tap-and-tell-saas` repository
- [ ] 1.2 Configure Nuxt layer structure
- [ ] 1.3 Set up SaaS-specific schema file
- [ ] 1.4 Create migration runner that includes SaaS tables
- [ ] 1.5 Add `isAdmin` middleware for super admin routes
- [ ] 1.6 Configure Vercel to deploy from private repo

### Phase 2: System Configuration
- [ ] 2.1 Create `saas_config` table and migrations
- [ ] 2.2 Implement config API routes (GET/PUT)
- [ ] 2.3 Build config management page
- [ ] 2.4 Add BETA_MODE live toggle
- [ ] 2.5 Cache config in memory with TTL

### Phase 3: Customer Management
- [ ] 3.1 Create customer list API with pagination/sorting
- [ ] 3.2 Build customer list page with DataTable
- [ ] 3.3 Implement customer detail API
- [ ] 3.4 Build customer detail page
- [ ] 3.5 Add plan change functionality
- [ ] 3.6 Add suspend/unsuspend functionality

### Phase 4: Invite System
- [ ] 4.1 Enhance existing beta_invites with admin features
- [ ] 4.2 Build invite list page
- [ ] 4.3 Create invite dialog with plan selection
- [ ] 4.4 Implement resend functionality
- [ ] 4.5 Add invite link copy feature

### Phase 5: Login Tracking
- [ ] 5.1 Create `login_events` table
- [ ] 5.2 Integrate IP geolocation (MaxMind GeoLite2)
- [ ] 5.3 Log all login attempts with location
- [ ] 5.4 Build login analytics API
- [ ] 5.5 Add login history to customer detail

### Phase 6: Real-Time Analytics
- [ ] 6.1 Set up SSE endpoint for live data
- [ ] 6.2 Track active sessions in Redis/memory
- [ ] 6.3 Build real-time dashboard widgets
- [ ] 6.4 Add WebSocket fallback (optional)
- [ ] 6.5 Implement live entry submission feed

### Phase 7: Historical Analytics
- [ ] 7.1 Create analytics summary API
- [ ] 7.2 Build chart components (registrations, logins, entries)
- [ ] 7.3 Add country distribution heatmap
- [ ] 7.4 Implement date range filtering
- [ ] 7.5 Add CSV export for analytics

### Phase 8: Push Notifications
- [ ] 8.1 Set up Web Push with VAPID keys
- [ ] 8.2 Create push subscription API
- [ ] 8.3 Build notification service
- [ ] 8.4 Add registration notification trigger
- [ ] 8.5 Build notification center UI
- [ ] 8.6 Add notification preferences

### Phase 9: Revenue Tracking (Stripe)
- [ ] 9.1 Create `revenue_events` table
- [ ] 9.2 Set up Stripe webhook handler
- [ ] 9.3 Track subscription events
- [ ] 9.4 Build revenue dashboard widgets
- [ ] 9.5 Calculate MRR/ARR metrics

### Phase 10: System Health
- [ ] 10.1 Create health check endpoint
- [ ] 10.2 Monitor database connections
- [ ] 10.3 Track storage usage
- [ ] 10.4 Add error rate monitoring
- [ ] 10.5 Build health dashboard

---

## Security Considerations

1. **Super Admin Access**: Only users with `isAdmin = true` can access `/_admin/*` routes
2. **Audit Logging**: All admin actions logged to `audit_logs`
3. **Rate Limiting**: Admin APIs rate-limited to prevent abuse
4. **No PII in Metrics**: Country/device data only, no IP storage in analytics
5. **Encryption**: Sensitive config values encrypted at rest

---

## Environment Variables (SaaS-only)

| Variable | Purpose |
|----------|---------|
| `VAPID_PUBLIC_KEY` | Web Push public key |
| `VAPID_PRIVATE_KEY` | Web Push private key |
| `MAXMIND_LICENSE_KEY` | GeoIP database license |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing |

---

## UI Components

### Dashboard Widgets
- `StatCard` — Single metric with trend indicator
- `LiveCounter` — Real-time updating number
- `MiniChart` — Sparkline for trends
- `CountryMap` — Choropleth world map
- `ActivityFeed` — Live event stream

### Data Display
- `DataTable` — Sortable, filterable, paginated table
- `CustomerCard` — Customer summary card
- `PlanBadge` — Plan indicator with colors
- `StatusDot` — Online/offline indicator

### Forms
- `InviteDialog` — Create/edit invite
- `PlanSelector` — Plan dropdown with descriptions
- `ConfigEditor` — JSON config editor

---

## Notes

- The `_admin` prefix ensures routes are ignored by Nuxt's default routing in CE builds
- All SaaS-specific code lives in the private repo layer
- CE builds have no knowledge of admin features
- Login tracking requires GeoIP database (MaxMind GeoLite2 - free with attribution)
- Real-time features use SSE for simplicity (no WebSocket server needed)
