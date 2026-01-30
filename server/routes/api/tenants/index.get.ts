import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { tenants, entries } from '~~/server/database/schema'
import { sql } from 'drizzle-orm'

/**
 * GET /api/tenants
 * Lists all tenants owned by the authenticated user.
 * Includes entry count for each tenant.
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
    settings: tenants.settings,
    createdAt: tenants.createdAt,
    updatedAt: tenants.updatedAt,
    entryCount: sql<number>`(SELECT COUNT(*) FROM entries WHERE entries.tenant_id = ${tenants.id})`
  })
    .from(tenants)
    .where(eq(tenants.ownerId, user.id))
    .all()

  return {
    success: true,
    data: rows
  }
})
