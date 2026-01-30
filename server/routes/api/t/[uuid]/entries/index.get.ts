/**
 * GET /api/t/:uuid/entries
 * Returns approved entries for a tenant's public guestbook.
 * No authentication required.
 */
export default defineEventHandler((event) => {
  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) {
    throw createError({ statusCode: 400, message: 'Tenant ID is required' })
  }

  const tenant = getTenantById(uuid)
  if (!tenant) {
    throw createError({ statusCode: 404, message: 'Guestbook not found' })
  }

  const tenantEntries = readApprovedEntries(uuid)

  return {
    success: true,
    data: tenantEntries
  }
})
