import { eq } from 'drizzle-orm'
import { apiApps } from '~~/server/database/schema'

/**
 * GET /api/tenants/:uuid/apps/:appId
 * Gets details for a specific API app.
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, message: 'Authentication required' })

  const uuid = getRouterParam(event, 'uuid')
  const appId = getRouterParam(event, 'appId')
  if (!uuid || !appId) throw createError({ statusCode: 400, message: 'Tenant ID and App ID required' })

  if (!await canPerformAction(uuid, user.id, 'read'))
    throw createError({ statusCode: 403, message: 'Forbidden' })

  const app = await withTenantContext(uuid, async (db) => {
    const rows = await db.select().from(apiApps).where(eq(apiApps.id, appId))
    return rows[0]
  })

  if (!app) throw createError({ statusCode: 404, message: 'App not found' })

  return { success: true, data: app }
})
