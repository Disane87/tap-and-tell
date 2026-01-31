/**
 * DELETE /api/tenants/:uuid/guestbooks/:gbUuid
 * Deletes a guestbook and all its entries.
 * Requires owner permission.
 */
export default defineEventHandler((event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const uuid = getRouterParam(event, 'uuid')
  const gbUuid = getRouterParam(event, 'gbUuid')
  if (!uuid || !gbUuid) {
    throw createError({ statusCode: 400, message: 'Tenant ID and Guestbook ID are required' })
  }

  if (!canPerformAction(uuid, user.id, 'delete')) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const existing = getGuestbookById(gbUuid)
  if (!existing || existing.tenantId !== uuid) {
    throw createError({ statusCode: 404, message: 'Guestbook not found' })
  }

  deleteGuestbook(gbUuid)

  return { success: true }
})
