import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { tenants } from '~~/server/database/schema'

/**
 * GET /api/t/:uuid/info
 * Returns public tenant information (name, settings).
 * No authentication required.
 */
export default defineEventHandler((event) => {
  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) {
    throw createError({ statusCode: 400, message: 'Tenant ID is required' })
  }

  const db = useDb()
  const tenant = db.select({
    id: tenants.id,
    name: tenants.name,
    settings: tenants.settings
  })
    .from(tenants)
    .where(eq(tenants.id, uuid))
    .get()

  if (!tenant) {
    throw createError({ statusCode: 404, message: 'Guestbook not found' })
  }

  return {
    success: true,
    data: tenant
  }
})
