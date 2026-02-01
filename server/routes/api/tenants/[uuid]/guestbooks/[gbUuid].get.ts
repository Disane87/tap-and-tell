import { sql, eq } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { guestbooks } from '~~/server/database/schema'

/**
 * GET /api/tenants/:uuid/guestbooks/:gbUuid
 * Returns guestbook details with entry count.
 * Requires authentication and tenant membership.
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const uuid = getRouterParam(event, 'uuid')
  const gbUuid = getRouterParam(event, 'gbUuid')
  if (!uuid || !gbUuid) {
    throw createError({ statusCode: 400, message: 'Tenant ID and Guestbook ID are required' })
  }

  if (!await canPerformAction(uuid, user.id, 'read')) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const db = useDb()
  const rows = await db.select({
    id: guestbooks.id,
    tenantId: guestbooks.tenantId,
    name: guestbooks.name,
    type: guestbooks.type,
    settings: guestbooks.settings,
    startDate: guestbooks.startDate,
    endDate: guestbooks.endDate,
    createdAt: guestbooks.createdAt,
    updatedAt: guestbooks.updatedAt,
    entryCount: sql<number>`(SELECT COUNT(*) FROM entries WHERE entries.guestbook_id = ${guestbooks.id})`
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
