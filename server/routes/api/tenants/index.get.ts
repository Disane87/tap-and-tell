import { sql } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { tenants, tenantMembers } from '~~/server/database/schema'
import { eq } from 'drizzle-orm'

/**
 * GET /api/tenants
 * Lists all tenants where the authenticated user is a member (owner or co_owner).
 * Includes guestbook count and the user's role for each tenant.
 */
export default defineEventHandler((event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const db = useDb()
  const rows = db.select({
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
    .where(eq(tenantMembers.userId, user.id))
    .all()

  return {
    success: true,
    data: rows
  }
})
