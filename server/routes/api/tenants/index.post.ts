import { randomUUID } from 'crypto'
import { useDb } from '~~/server/database'
import { tenants } from '~~/server/database/schema'
import type { CreateTenantInput } from '~~/server/types/tenant'

/**
 * POST /api/tenants
 * Creates a new tenant (guestbook) for the authenticated user.
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
  const id = randomUUID()
  const now = new Date().toISOString()

  db.insert(tenants).values({
    id,
    name: body.name.trim(),
    ownerId: user.id,
    settings: body.settings || {},
    createdAt: now,
    updatedAt: now
  }).run()

  return {
    success: true,
    data: {
      id,
      name: body.name.trim(),
      ownerId: user.id,
      settings: body.settings || {},
      createdAt: now,
      updatedAt: now
    }
  }
})
