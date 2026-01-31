import { sql, eq } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { tenants } from '~~/server/database/schema'
import { canPerformAction, getUserTenantRole } from '~~/server/utils/tenant'

/**
 * GET /api/tenants/:uuid
 * Returns tenant details for authenticated members (owner or co_owner).
 * Includes guestbook count.
 */
export default defineEventHandler((event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) {
    throw createError({ statusCode: 400, message: 'Tenant ID is required' })
  }

  if (!canPerformAction(uuid, user.id, 'read')) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const db = useDb()
  const tenant = db.select({
    id: tenants.id,
    name: tenants.name,
    ownerId: tenants.ownerId,
    createdAt: tenants.createdAt,
    updatedAt: tenants.updatedAt,
    guestbookCount: sql<number>`(SELECT COUNT(*) FROM guestbooks WHERE guestbooks.tenant_id = ${tenants.id})`
  })
    .from(tenants)
    .where(eq(tenants.id, uuid))
    .get()

  if (!tenant) {
    throw createError({ statusCode: 404, message: 'Tenant not found' })
  }

  const role = getUserTenantRole(uuid, user.id)

  return {
    success: true,
    data: { ...tenant, role }
  }
})
