import type { TenantSettings } from '~~/server/database/schema'

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
 * Tenant object representing a guestbook instance.
 */
export interface Tenant {
  id: string
  name: string
  ownerId: string
  settings: TenantSettings
  createdAt: string
  updatedAt: string
}

/**
 * Input for creating a new tenant.
 */
export interface CreateTenantInput {
  name: string
  settings?: TenantSettings
}

/**
 * Input for updating an existing tenant.
 */
export interface UpdateTenantInput {
  name?: string
  settings?: TenantSettings
}
