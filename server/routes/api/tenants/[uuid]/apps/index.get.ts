import { apiApps } from '~~/server/database/schema'
import { sql } from 'drizzle-orm'

/**
 * GET /api/tenants/:uuid/apps
 * Lists all API apps for a tenant.
 * Requires read permission.
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, message: 'Authentication required' })

  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) throw createError({ statusCode: 400, message: 'Tenant ID required' })

  if (!await canPerformAction(uuid, user.id, 'read'))
    throw createError({ statusCode: 403, message: 'Forbidden' })

  const apps = await withTenantContext(uuid, async (db) => {
    return db.select({
      id: apiApps.id,
      name: apiApps.name,
      description: apiApps.description,
      createdAt: apiApps.createdAt,
      updatedAt: apiApps.updatedAt,
      tokenCount: sql<number>`(SELECT COUNT(*) FROM api_tokens WHERE api_tokens.app_id = ${apiApps.id} AND api_tokens.revoked_at IS NULL)`
    }).from(apiApps)
  })

  return { success: true, data: apps }
})
