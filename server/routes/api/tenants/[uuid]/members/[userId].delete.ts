import { canPerformAction, removeTenantMember } from '~~/server/utils/tenant'

/**
 * DELETE /api/tenants/:uuid/members/:userId
 * Removes a member from a tenant. Only the owner can remove members.
 * The owner cannot be removed.
 *
 * @param uuid - The tenant ID.
 * @param userId - The user ID of the member to remove.
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }
  requireScope(event, 'members:write')

  const uuid = getRouterParam(event, 'uuid')
  const userId = getRouterParam(event, 'userId')

  if (!uuid || !userId) {
    throw createError({ statusCode: 400, message: 'Tenant ID and user ID are required' })
  }

  if (!await canPerformAction(uuid, user.id, 'manage')) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const removed = await removeTenantMember(uuid, userId)
  if (!removed) {
    throw createError({ statusCode: 400, message: 'Cannot remove this member' })
  }

  await recordAuditLog(event, 'member.remove', { tenantId: uuid, resourceType: 'member', resourceId: userId })

  return { success: true }
})
