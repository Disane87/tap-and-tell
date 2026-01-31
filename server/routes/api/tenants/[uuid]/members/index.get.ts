import { canPerformAction, getTenantMembers } from '~~/server/utils/tenant'

/**
 * GET /api/tenants/:uuid/members
 * Returns all members of a tenant with their user details.
 * Requires authentication and read permission (owner or co_owner).
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

  if (!canPerformAction(uuid, user.id, 'read')) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const members = getTenantMembers(uuid)

  return {
    success: true,
    data: members
  }
})
