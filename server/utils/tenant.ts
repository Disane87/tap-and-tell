import { eq, and, sql } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { tenants, tenantMembers, users, guestbooks } from '~~/server/database/schema'
import type { TenantRole } from '~~/server/database/schema'
import type { TenantMemberWithUser } from '~~/server/types/tenant'

/**
 * Actions that can be checked against a user's tenant role.
 * - read/moderate: owner + co_owner
 * - manage/delete: owner only
 */
export type TenantAction = 'read' | 'moderate' | 'manage' | 'delete'

/**
 * Returns the first tenant in the database (used for legacy route compatibility).
 * If no tenants exist, returns undefined.
 *
 * @returns The default tenant ID or undefined.
 */
export async function getDefaultTenantId(): Promise<string | undefined> {
  const db = useDb()
  const rows = await db.select({ id: tenants.id }).from(tenants).limit(1)
  return rows[0]?.id
}

/**
 * Retrieves a tenant by ID.
 *
 * @param id - The tenant UUID.
 * @returns The tenant row or undefined.
 */
export async function getTenantById(id: string) {
  const db = useDb()
  const rows = await db.select().from(tenants).where(eq(tenants.id, id))
  return rows[0]
}

/**
 * Retrieves all tenants owned by a user.
 *
 * @param ownerId - The owner user ID.
 * @returns Array of tenant rows.
 * @deprecated Use getUserTenants() instead which includes co-owned tenants.
 */
export async function getTenantsByOwner(ownerId: string) {
  const db = useDb()
  return db.select().from(tenants).where(eq(tenants.ownerId, ownerId))
}

/**
 * Verifies that a user owns a given tenant.
 *
 * @param tenantId - The tenant ID.
 * @param userId - The user ID to check ownership for.
 * @returns True if the user owns the tenant.
 * @deprecated Use canPerformAction() instead for role-based access control.
 */
export async function verifyTenantOwnership(tenantId: string, userId: string): Promise<boolean> {
  const tenant = await getTenantById(tenantId)
  return tenant?.ownerId === userId
}

/**
 * Returns the role a user has in a tenant, or null if not a member.
 *
 * @param tenantId - The tenant ID.
 * @param userId - The user ID.
 * @returns The user's role or null.
 */
export async function getUserTenantRole(tenantId: string, userId: string): Promise<TenantRole | null> {
  const db = useDb()
  const rows = await db.select({ role: tenantMembers.role })
    .from(tenantMembers)
    .where(and(
      eq(tenantMembers.tenantId, tenantId),
      eq(tenantMembers.userId, userId)
    ))
  const member = rows[0]
  return (member?.role as TenantRole) ?? null
}

/**
 * Checks whether a user can perform a given action on a tenant.
 *
 * @param tenantId - The tenant ID.
 * @param userId - The user ID.
 * @param action - The action to check.
 * @returns True if the user has permission.
 */
export async function canPerformAction(tenantId: string, userId: string, action: TenantAction): Promise<boolean> {
  const role = await getUserTenantRole(tenantId, userId)
  if (!role) return false

  switch (action) {
    case 'read':
    case 'moderate':
      return role === 'owner' || role === 'co_owner'
    case 'manage':
    case 'delete':
      return role === 'owner'
    default:
      return false
  }
}

/**
 * Returns all members of a tenant with their user details.
 *
 * @param tenantId - The tenant ID.
 * @returns Array of members with user info.
 */
export async function getTenantMembers(tenantId: string): Promise<TenantMemberWithUser[]> {
  const db = useDb()
  const rows = await db.select({
    id: tenantMembers.id,
    tenantId: tenantMembers.tenantId,
    userId: tenantMembers.userId,
    role: tenantMembers.role,
    invitedBy: tenantMembers.invitedBy,
    createdAt: tenantMembers.createdAt,
    userName: users.name,
    userEmail: users.email
  })
    .from(tenantMembers)
    .innerJoin(users, eq(tenantMembers.userId, users.id))
    .where(eq(tenantMembers.tenantId, tenantId))

  return rows.map(row => ({
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId,
    role: row.role as TenantRole,
    invitedBy: row.invitedBy,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    user: {
      id: row.userId,
      email: row.userEmail,
      name: row.userName
    }
  }))
}

/**
 * Returns all tenants where a user is a member (owner or co_owner).
 *
 * @param userId - The user ID.
 * @returns Array of tenants with the user's role.
 */
export async function getUserTenants(userId: string) {
  const db = useDb()
  return db.select({
    id: tenants.id,
    name: tenants.name,
    ownerId: tenants.ownerId,
    createdAt: tenants.createdAt,
    updatedAt: tenants.updatedAt,
    guestbookCount: sql<number>`(SELECT COUNT(*) FROM guestbooks WHERE guestbooks.tenant_id = ${tenants.id})`,
    role: tenantMembers.role
  })
    .from(tenantMembers)
    .innerJoin(tenants, eq(tenantMembers.tenantId, tenants.id))
    .where(eq(tenantMembers.userId, userId))
}

/**
 * Adds a user as a member of a tenant.
 *
 * @param tenantId - The tenant ID.
 * @param userId - The user ID to add.
 * @param role - The role to assign.
 * @param invitedBy - The user ID of the inviter (optional).
 */
export async function addTenantMember(tenantId: string, userId: string, role: TenantRole, invitedBy?: string): Promise<void> {
  const db = useDb()
  await db.insert(tenantMembers).values({
    id: generateId(),
    tenantId,
    userId,
    role,
    invitedBy: invitedBy ?? null,
    createdAt: new Date()
  })
}

/**
 * Removes a user from a tenant's members.
 * Cannot remove the owner.
 *
 * @param tenantId - The tenant ID.
 * @param userId - The user ID to remove.
 * @returns True if a member was removed.
 */
export async function removeTenantMember(tenantId: string, userId: string): Promise<boolean> {
  const role = await getUserTenantRole(tenantId, userId)
  if (!role || role === 'owner') return false

  const db = useDb()
  await db.delete(tenantMembers)
    .where(and(
      eq(tenantMembers.tenantId, tenantId),
      eq(tenantMembers.userId, userId)
    ))
  return true
}
