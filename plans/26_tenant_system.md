# Multi tenancy support
To support multiple tenants (e.g., different events or organizations using the same app instance), we will implement the following changes:

## Householding
Every household (tenant) will have its own isolated set of guestbook entries. Every tenant has an admin.
On register, there will be a unique tenant identifier (UUID) that determines which tenant the user is interacting with.
Every tenant will have its own admin and is locked to their own entries.

This will require:

- Add a `tenantId` field to guestbook entries to associate them with a specific tenant.
- Update the entry creation API to accept a `tenantId` parameter.
- Modify the frontend to include the `tenantId` when submitting new entries.
- Update the data storage structure to organize entries by `tenantId`.
- Update the guestbook display page to filter entries based on the current `tenantId`.

## Concepts

- **Tenant** = A home/household with their own guestbook
- **Owner** = The person who created/manages the tenant
- **Guest** = Visitors who leave entries (no account needed)
- **Admin** = Creating Household with NFC/QR (internal role for SaaS when buying phsical QR/NFC products)

## Data Model

### Tenant Schema
```typescript
interface Tenant {
  id: string                // UUID (e.g., "550e8400-e29b-41d4-a716-446655440000")
  name: string              // display name (e.g., "The Smith Family")
  ownerId: string           // reference to owner user
  settings: TenantSettings
  subscription: SubscriptionInfo
  createdAt: string
  updatedAt: string
}

interface TenantSettings {
  welcomeMessage: string
  theme: 'light' | 'dark' | 'system'
  primaryColor?: string
  logoUrl?: string
  requirePhoto: boolean
  moderationEnabled: boolean
}
```

### Updated Entry Schema
```typescript
interface GuestEntry {
  id: string
  tenantId: string          // NEW: links to tenant
  name: string
  message: string
  photoUrl: string | null
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}
```

## URL Structure

```
/                           # Marketing landing page
/login                      # Owner login
/register                   # Owner registration
/dashboard                  # Owner dashboard (manage tenants)
/t/[uuid]                   # Guest-facing guestbook (e.g., /t/550e8400-e29b-41d4-a716-446655440000)
/t/[uuid]/guestbook         # View entries
/t/[uuid]/admin             # Tenant admin panel
```

## Why UUIDs

- **Privacy**: No guessable URLs, harder to enumerate tenants
- **Simplicity**: No slug uniqueness validation needed
- **NFC-friendly**: UUIDs work well encoded in NFC tags
- **Conflict-free**: No naming collisions between tenants

## Features

### For Owners
- Create multiple homes/tenants
- Customize each guestbook (name, colors, welcome message)
- Moderate entries per tenant
- View analytics per tenant
- Generate NFC/QR codes per tenant

### For Guests
- No registration required
- Access via `/t/[uuid]` or NFC/QR
- Leave name, photo, message
- View approved entries

## Database Migration

- Move from file-based to PostgreSQL/SQLite
- Add `tenants` table
- Add `users` table (owners)
- Update `entries` table with `tenant_id`

## API Routes

```
# Public (guest-facing)
GET  /api/t/[uuid]/entries
POST /api/t/[uuid]/entries
GET  /api/t/[uuid]/info          # Get tenant public info (name, settings)

# Owner routes
GET  /api/tenants
POST /api/tenants                 # Returns new tenant with UUID
GET  /api/tenants/[uuid]
PUT  /api/tenants/[uuid]
DELETE /api/tenants/[uuid]

# Tenant admin routes
GET  /api/tenants/[uuid]/entries
DELETE /api/tenants/[uuid]/entries/[entryId]
PUT  /api/tenants/[uuid]/entries/[entryId]/approve
```

## Implementation Steps

1. Set up database (Drizzle ORM + SQLite/PostgreSQL)
2. Create tenant and user schemas
3. Implement owner authentication (separate from guest flow)
4. Create tenant CRUD API
5. Update entry API to be tenant-scoped
6. Build owner dashboard UI
7. Create tenant-specific guest pages
8. Add tenant settings/customization
