import { eq } from 'drizzle-orm'
import { apiApps } from '~~/server/database/schema'

/**
 * DELETE /api/tenants/:uuid/apps/:appId
 * Deletes an API app and all its tokens (CASCADE).
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, message: 'Authentication required' })

  const uuid = getRouterParam(event, 'uuid')
  const appId = getRouterParam(event, 'appId')
  if (!uuid || !appId) throw createError({ statusCode: 400, message: 'Tenant ID and App ID required' })

  if (!await canPerformAction(uuid, user.id, 'manage'))
    throw createError({ statusCode: 403, message: 'Forbidden' })

  await withTenantContext(uuid, async (db) => {
    await db.delete(apiApps).where(eq(apiApps.id, appId))
  })

  await recordAuditLog(event, 'api_app.delete', { tenantId: uuid, resourceType: 'api_app', resourceId: appId })

  return { success: true }
})
