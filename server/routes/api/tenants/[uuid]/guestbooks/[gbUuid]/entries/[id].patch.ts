import type { EntryStatus } from '~~/server/types/guest'

/**
 * PATCH /api/tenants/:uuid/guestbooks/:gbUuid/entries/:id
 * Updates the moderation status of an entry.
 * Requires authentication and moderate permission.
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const uuid = getRouterParam(event, 'uuid')
  const gbUuid = getRouterParam(event, 'gbUuid')
  const id = getRouterParam(event, 'id')

  if (!uuid || !gbUuid || !id) {
    throw createError({ statusCode: 400, message: 'Tenant ID, Guestbook ID, and entry ID are required' })
  }

  if (!await canPerformAction(uuid, user.id, 'moderate')) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const guestbook = await getGuestbookById(gbUuid)
  if (!guestbook || guestbook.tenantId !== uuid) {
    throw createError({ statusCode: 404, message: 'Guestbook not found' })
  }

  const body = await readBody<{ status: EntryStatus; rejectionReason?: string }>(event)
  if (!body?.status || !['pending', 'approved', 'rejected'].includes(body.status)) {
    throw createError({ statusCode: 400, message: 'Invalid status' })
  }

  const entry = await updateEntryStatus(uuid, id, body.status, body.rejectionReason)
  if (!entry) {
    throw createError({ statusCode: 404, message: 'Entry not found' })
  }

  return {
    success: true,
    data: entry
  }
})
