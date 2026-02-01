/**
 * DELETE /api/tenants/:uuid/guestbooks/:gbUuid/entries/:id
 * Deletes an entry from a guestbook.
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

  const deleted = await deleteEntry(uuid, id)
  if (!deleted) {
    throw createError({ statusCode: 404, message: 'Entry not found' })
  }

  await recordAuditLog(event, 'entry.delete', { tenantId: uuid, resourceType: 'entry', resourceId: id })

  return { success: true }
})
