import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { tenants } from '~~/server/database/schema'

/**
 * Returns the first tenant in the database (used for legacy route compatibility).
 * If no tenants exist, returns undefined.
 *
 * @returns The default tenant ID or undefined.
 */
export function getDefaultTenantId(): string | undefined {
  const db = useDb()
  const row = db.select({ id: tenants.id }).from(tenants).limit(1).get()
  return row?.id
}

/**
 * Retrieves a tenant by ID.
 *
 * @param id - The tenant UUID.
 * @returns The tenant row or undefined.
 */
export function getTenantById(id: string) {
  const db = useDb()
  return db.select().from(tenants).where(eq(tenants.id, id)).get()
}

/**
 * Retrieves all tenants owned by a user.
 *
 * @param ownerId - The owner user ID.
 * @returns Array of tenant rows.
 */
export function getTenantsByOwner(ownerId: string) {
  const db = useDb()
  return db.select().from(tenants).where(eq(tenants.ownerId, ownerId)).all()
}

/**
 * Verifies that a user owns a given tenant.
 *
 * @param tenantId - The tenant ID.
 * @param userId - The user ID to check ownership for.
 * @returns True if the user owns the tenant.
 */
export function verifyTenantOwnership(tenantId: string, userId: string): boolean {
  const tenant = getTenantById(tenantId)
  return tenant?.ownerId === userId
}
