import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { tenants } from '~~/server/database/schema'
import type { UpdateTenantInput } from '~~/server/types/tenant'

/**
 * PUT /api/tenants/:uuid
 * Updates an existing tenant. Only the owner can update.
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

  const db = useDb()
  const tenant = db.select().from(tenants).where(eq(tenants.id, uuid)).get()

  if (!tenant) {
    throw createError({ statusCode: 404, message: 'Tenant not found' })
  }

  if (tenant.ownerId !== user.id) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const body = await readBody<UpdateTenantInput>(event)

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString()
  }

  if (body?.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      throw createError({ statusCode: 400, message: 'Tenant name cannot be empty' })
    }
    updates.name = body.name.trim()
  }

  if (body?.settings !== undefined) {
    updates.settings = body.settings
  }

  db.update(tenants).set(updates).where(eq(tenants.id, uuid)).run()

  const updated = db.select().from(tenants).where(eq(tenants.id, uuid)).get()

  return {
    success: true,
    data: updated
  }
})
