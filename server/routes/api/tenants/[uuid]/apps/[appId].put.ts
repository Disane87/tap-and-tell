import { eq } from 'drizzle-orm'
import { apiApps } from '~~/server/database/schema'

/**
 * PUT /api/tenants/:uuid/apps/:appId
 * Updates an API app's name or description.
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, message: 'Authentication required' })

  const uuid = getRouterParam(event, 'uuid')
  const appId = getRouterParam(event, 'appId')
  if (!uuid || !appId) throw createError({ statusCode: 400, message: 'Tenant ID and App ID required' })

  if (!await canPerformAction(uuid, user.id, 'manage'))
    throw createError({ statusCode: 403, message: 'Forbidden' })

  const body = await readBody<{ name?: string; description?: string }>(event)

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (body?.name?.trim()) updates.name = body.name.trim()
  if (body?.description !== undefined) updates.description = body.description?.trim() || null

  await withTenantContext(uuid, async (db) => {
    await db.update(apiApps).set(updates).where(eq(apiApps.id, appId))
  })

  await recordAuditLog(event, 'api_app.update', { tenantId: uuid, resourceType: 'api_app', resourceId: appId })

  return { success: true }
})
