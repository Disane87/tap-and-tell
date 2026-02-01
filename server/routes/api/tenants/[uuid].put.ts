import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { tenants } from '~~/server/database/schema'
import type { UpdateTenantInput } from '~~/server/types/tenant'
import { canPerformAction } from '~~/server/utils/tenant'

/**
 * PUT /api/tenants/:uuid
 * Updates an existing tenant. Only the owner can update (manage action).
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) {
    throw createError({ statusCode: 400, message: 'Tenant ID is required' })
  }

  if (!await canPerformAction(uuid, user.id, 'manage')) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const db = useDb()
  const rows = await db.select().from(tenants).where(eq(tenants.id, uuid))
  const tenant = rows[0]

  if (!tenant) {
    throw createError({ statusCode: 404, message: 'Tenant not found' })
  }

  const body = await readBody<UpdateTenantInput>(event)

  const updates: Record<string, unknown> = {
    updatedAt: new Date()
  }

  if (body?.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      throw createError({ statusCode: 400, message: 'Tenant name cannot be empty' })
    }
    updates.name = body.name.trim()
  }

  await db.update(tenants).set(updates).where(eq(tenants.id, uuid))

  const updatedRows = await db.select().from(tenants).where(eq(tenants.id, uuid))

  await recordAuditLog(event, 'tenant.update', { tenantId: uuid, resourceType: 'tenant', resourceId: uuid })

  return {
    success: true,
    data: updatedRows[0]
  }
})
