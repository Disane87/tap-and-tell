/**
 * DELETE /api/tenants/:uuid/entries/:id
 * Deletes an entry from a tenant. Requires authentication and tenant ownership.
 */
export default defineEventHandler((event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const uuid = getRouterParam(event, 'uuid')
  const id = getRouterParam(event, 'id')

  if (!uuid || !id) {
    throw createError({ statusCode: 400, message: 'Tenant ID and entry ID are required' })
  }

  if (!verifyTenantOwnership(uuid, user.id)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const deleted = deleteEntry(id)
  if (!deleted) {
    throw createError({ statusCode: 404, message: 'Entry not found' })
  }

  return { success: true }
})
