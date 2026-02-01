/**
 * GET /api/tenants/:uuid/guestbooks
 * Lists all guestbooks for a tenant with entry counts.
 * Requires authentication and tenant membership.
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }
  requireScope(event, 'guestbooks:read')

  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) {
    throw createError({ statusCode: 400, message: 'Tenant ID is required' })
  }

  if (!await canPerformAction(uuid, user.id, 'read')) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const guestbookList = await getGuestbooksByTenant(uuid)

  return {
    success: true,
    data: guestbookList
  }
})
