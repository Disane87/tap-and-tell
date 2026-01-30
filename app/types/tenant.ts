/**
 * Tenant settings configurable by the owner.
 */
export interface TenantSettings {
  moderationEnabled?: boolean
  welcomeMessage?: string
  themeColor?: string
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
  entryCount?: number
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
