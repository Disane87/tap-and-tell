/**
 * Role a user can have within a tenant.
 */
export type TenantRole = 'owner' | 'co_owner'

/**
 * Tenant object representing an organizational unit.
 * Settings have moved to guestbook level.
 */
export interface Tenant {
  id: string
  name: string
  ownerId: string
  plan?: string
  createdAt: string
  updatedAt: string
  guestbookCount?: number
  role?: TenantRole
}

/**
 * Input for creating a new tenant.
 */
export interface CreateTenantInput {
  name: string
}

/**
 * Input for updating an existing tenant.
 */
export interface UpdateTenantInput {
  name?: string
}

/**
 * A tenant member with user details for display.
 */
export interface TenantMemberWithUser {
  id: string
  tenantId: string
  userId: string
  role: TenantRole
  invitedBy: string | null
  createdAt: string
  user: {
    id: string
    email: string
    name: string
  }
}

/**
 * A pending invitation to join a tenant.
 */
export interface TenantInvite {
  id: string
  tenantId: string
  email: string
  role: TenantRole
  invitedBy: string
  token: string
  expiresAt: string
  acceptedAt: string | null
  createdAt: string
  tenantName?: string
}
