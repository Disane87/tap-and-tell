import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { guestbooks } from '~~/server/database/schema'

/**
 * GET /api/t/:uuid/g/:gbUuid/info
 * Returns public guestbook information (name, settings).
 * No authentication required.
 */
export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')
  const gbUuid = getRouterParam(event, 'gbUuid')
  if (!uuid || !gbUuid) {
    throw createError({ statusCode: 400, message: 'Tenant ID and Guestbook ID are required' })
  }

  const db = useDb()
  const rows = await db.select({
    id: guestbooks.id,
    tenantId: guestbooks.tenantId,
    name: guestbooks.name,
    type: guestbooks.type,
    settings: guestbooks.settings
  })
    .from(guestbooks)
    .where(eq(guestbooks.id, gbUuid))

  const guestbook = rows[0]

  if (!guestbook || guestbook.tenantId !== uuid) {
    throw createError({ statusCode: 404, message: 'Guestbook not found' })
  }

  return {
    success: true,
    data: guestbook
  }
})
