import type { EntryStatus } from '~~/server/types/guest'

/**
 * POST /api/tenants/:uuid/guestbooks/:gbUuid/entries/bulk
 * Bulk updates the moderation status of multiple entries.
 * Requires authentication and moderate permission.
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }
  requireScope(event, 'entries:write')

  const uuid = getRouterParam(event, 'uuid')
  const gbUuid = getRouterParam(event, 'gbUuid')
  if (!uuid || !gbUuid) {
    throw createError({ statusCode: 400, message: 'Tenant ID and Guestbook ID are required' })
  }

  if (!await canPerformAction(uuid, user.id, 'moderate')) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const guestbook = await getGuestbookById(gbUuid)
  if (!guestbook || guestbook.tenantId !== uuid) {
    throw createError({ statusCode: 404, message: 'Guestbook not found' })
  }

  const body = await readBody<{ ids: string[]; status: EntryStatus }>(event)
  if (!body?.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
    throw createError({ statusCode: 400, message: 'Entry IDs required' })
  }

  if (!body?.status || !['pending', 'approved', 'rejected'].includes(body.status)) {
    throw createError({ statusCode: 400, message: 'Invalid status' })
  }

  const updated = await bulkUpdateEntryStatus(uuid, body.ids, body.status)

  await recordAuditLog(event, 'entry.bulk_update', { tenantId: uuid, resourceType: 'entry', details: { ids: body.ids, status: body.status } })

  return {
    success: true,
    data: { updated }
  }
})
