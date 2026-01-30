/**
 * GET /api/tenants/:uuid/entries
 * Returns all entries for a tenant (including pending/rejected).
 * Requires authentication and tenant ownership.
 */
export default defineEventHandler((event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) {
    throw createError({ statusCode: 400, message: 'Tenant ID is required' })
  }

  if (!verifyTenantOwnership(uuid, user.id)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const tenantEntries = readEntries(uuid)

  return {
    success: true,
    data: tenantEntries
  }
})
