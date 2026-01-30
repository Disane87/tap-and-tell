import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { tenants } from '~~/server/database/schema'

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

  const db = useDb()
  const tenant = db.select().from(tenants).where(eq(tenants.id, uuid)).get()

  if (!tenant) {
    throw createError({ statusCode: 404, message: 'Tenant not found' })
  }

  if (tenant.ownerId !== user.id) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  // CASCADE will delete all entries too
  db.delete(tenants).where(eq(tenants.id, uuid)).run()

  return { success: true }
})
