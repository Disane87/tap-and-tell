import type { TenantRole } from '~~/server/database/schema'

/**
 * User object returned from API.
 */
export interface User {
  id: string
  email: string
  name: string
}

/**
 * Session stored in the database.
 */
export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: string
  createdAt: string
}

/**
 * Tenant object representing an organizational unit.
 * Settings have moved to guestbook level.
 */
export interface Tenant {
  id: string
  name: string
  ownerId: string
  createdAt: string
  updatedAt: string
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
 * A tenant member with role assignment.
 */
export interface TenantMember {
  id: string
  tenantId: string
  userId: string
  role: TenantRole
  invitedBy: string | null
  createdAt: string
}

/**
 * A tenant member with user details included.
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
}

export type { TenantRole }
