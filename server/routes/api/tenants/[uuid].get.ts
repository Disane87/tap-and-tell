import { sql } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { tenants } from '~~/server/database/schema'

/**
 * GET /api/tenants/:uuid
 * Returns tenant details for the authenticated owner.
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

  const db = useDb()
  const tenant = db.select({
    id: tenants.id,
    name: tenants.name,
    ownerId: tenants.ownerId,
    settings: tenants.settings,
    createdAt: tenants.createdAt,
    updatedAt: tenants.updatedAt,
    entryCount: sql<number>`(SELECT COUNT(*) FROM entries WHERE entries.tenant_id = ${tenants.id})`
  })
    .from(tenants)
    .where(eq(tenants.id, uuid))
    .get()

  if (!tenant) {
    throw createError({ statusCode: 404, message: 'Tenant not found' })
  }

  if (tenant.ownerId !== user.id) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  return {
    success: true,
    data: tenant
  }
})
