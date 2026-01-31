# Plan 27b: Roles & Permissions

## Overview

3-role system (Owner, Co-Owner, Guest) with `tenant_members` table, role-based access control, and invite system.

## Roles

| Role | Authenticated | DB Entry | Description |
|------|--------------|----------|-------------|
| **Owner** | Yes | `tenant_members.role = 'owner'` | Tenant creator. Full control: settings, members, entries, delete tenant |
| **Co-Owner** | Yes | `tenant_members.role = 'co_owner'` | Invited by owner. Can moderate entries (approve/reject/delete), but no settings/members management |
| **Guest** | No | None | Anonymous visitors. Can submit entries via `/t/[uuid]`. Implicit, no DB representation |

## Permission Matrix

| Action | Owner | Co-Owner | Guest |
|--------|-------|----------|-------|
| View approved entries | ✓ | ✓ | ✓ (public) |
| Create entry | ✓ | ✓ | ✓ (public) |
| View all entries (incl. pending) | ✓ | ✓ | ✗ |
| Moderate entries (approve/reject) | ✓ | ✓ | ✗ |
| Delete entries | ✓ | ✓ | ✗ |
| Edit tenant settings | ✓ | ✗ | ✗ |
| Manage members (invite/remove) | ✓ | ✗ | ✗ |
| Delete tenant | ✓ | ✗ | ✗ |
| Generate QR code | ✓ | ✓ | ✗ |

## Database Tables

### `tenant_members`
- `id` TEXT PK
- `tenant_id` TEXT FK→tenants (CASCADE)
- `user_id` TEXT FK→users (CASCADE)
- `role` TEXT ('owner' | 'co_owner')
- `invited_by` TEXT FK→users (nullable)
- `created_at` TEXT
- UNIQUE(tenant_id, user_id)

### `tenant_invites`
- `id` TEXT PK
- `tenant_id` TEXT FK→tenants (CASCADE)
- `email` TEXT
- `role` TEXT ('co_owner')
- `invited_by` TEXT FK→users
- `token` TEXT UNIQUE
- `expires_at` TEXT
- `accepted_at` TEXT (nullable)
- `created_at` TEXT

## API Endpoints

### Member Management
- `GET /api/tenants/[uuid]/members` — List members (auth: read)
- `POST /api/tenants/[uuid]/members/invite` — Invite co-owner (auth: manage/owner only)
- `DELETE /api/tenants/[uuid]/members/[userId]` — Remove member (auth: manage/owner only)

### Invite Flow
- `GET /api/invites/[token]` — Get invite details (public)
- `POST /api/invites/accept` — Accept invite (auth: logged in)

### Updated Routes
All existing tenant routes now use `canPerformAction()` instead of `verifyTenantOwnership()`.

## Invite Flow

1. Owner enters co-owner email in admin panel
2. System creates `tenant_invites` row with unique token (7-day expiry)
3. Owner copies invite link and shares it
4. Invitee opens `/accept-invite?token=...`
5. Invitee logs in (or registers), then accepts
6. System creates `tenant_members` entry, marks invite as accepted
7. Co-owner sees tenant in their dashboard

## Implementation Status

- ✔ Phase 1: Schema, migration, seed, types
- ✔ Phase 2: Permission logic (`canPerformAction`, `getUserTenantRole`, etc.)
- ✔ Phase 3: API routes updated + new member/invite routes
- ✔ Phase 4: Frontend (composable, dashboard badges, admin members section, accept-invite page, i18n)
- ✔ Phase 5: Documentation
