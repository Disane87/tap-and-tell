import { useDb } from '~~/server/database'
import { tenants } from '~~/server/database/schema'
import type { CreateTenantInput } from '~~/server/types/tenant'
import { addTenantMember } from '~~/server/utils/tenant'

/**
 * POST /api/tenants
 * Creates a new tenant for the authenticated user.
 * Automatically adds the creator as owner in tenant_members.
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const body = await readBody<CreateTenantInput>(event)

  if (!body?.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    throw createError({ statusCode: 400, message: 'Tenant name is required' })
  }

  if (body.name.length > 100) {
    throw createError({ statusCode: 400, message: 'Name must be 100 characters or less' })
  }

  const db = useDb()
  const id = generateId()
  const now = new Date().toISOString()

  db.insert(tenants).values({
    id,
    name: body.name.trim(),
    ownerId: user.id,
    createdAt: now,
    updatedAt: now
  }).run()

  // Add creator as owner member
  addTenantMember(id, user.id, 'owner')

  return {
    success: true,
    data: {
      id,
      name: body.name.trim(),
      ownerId: user.id,
      createdAt: now,
      updatedAt: now
    }
  }
})
