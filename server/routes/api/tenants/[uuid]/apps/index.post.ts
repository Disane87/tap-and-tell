import { useDb } from '~~/server/database'
import { apiApps } from '~~/server/database/schema'

/**
 * POST /api/tenants/:uuid/apps
 * Creates a new API app for the tenant.
 * Requires manage permission (owner only).
 * Body: { name: string, description?: string }
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, message: 'Authentication required' })

  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) throw createError({ statusCode: 400, message: 'Tenant ID required' })

  if (!await canPerformAction(uuid, user.id, 'manage'))
    throw createError({ statusCode: 403, message: 'Forbidden' })

  const body = await readBody<{ name: string; description?: string }>(event)
  if (!body?.name?.trim()) throw createError({ statusCode: 400, message: 'App name is required' })
  if (body.name.length > 100) throw createError({ statusCode: 400, message: 'Name must be 100 chars or less' })

  const db = useDb()
  const id = generateId()
  const now = new Date()

  await db.insert(apiApps).values({
    id,
    tenantId: uuid,
    userId: user.id,
    name: body.name.trim(),
    description: body.description?.trim() || null,
    createdAt: now,
    updatedAt: now
  })

  await recordAuditLog(event, 'api_app.create', { tenantId: uuid, resourceType: 'api_app', resourceId: id })

  return { success: true, data: { id, name: body.name.trim(), description: body.description?.trim() || null } }
})
