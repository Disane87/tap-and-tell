/**
 * DELETE /api/tenants/:uuid/guestbooks/:gbUuid/entries/:id
 * Deletes an entry from a guestbook.
 * Requires authentication and moderate permission.
 */
export default defineEventHandler((event) => {
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

  if (!canPerformAction(uuid, user.id, 'moderate')) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const guestbook = getGuestbookById(gbUuid)
  if (!guestbook || guestbook.tenantId !== uuid) {
    throw createError({ statusCode: 404, message: 'Guestbook not found' })
  }

  const deleted = deleteEntry(id)
  if (!deleted) {
    throw createError({ statusCode: 404, message: 'Entry not found' })
  }

  return { success: true }
})
