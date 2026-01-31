import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { tenants } from '~~/server/database/schema'
import { canPerformAction } from '~~/server/utils/tenant'

/**
 * DELETE /api/tenants/:uuid
 * Deletes a tenant and all its entries. Only the owner can delete.
 */
export default defineEventHandler((event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) {
    throw createError({ statusCode: 400, message: 'Tenant ID is required' })
  }

  if (!canPerformAction(uuid, user.id, 'delete')) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const db = useDb()
  // CASCADE will delete all entries and members too
  db.delete(tenants).where(eq(tenants.id, uuid)).run()

  return { success: true }
})
