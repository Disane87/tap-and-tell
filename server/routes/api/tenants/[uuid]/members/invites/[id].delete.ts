import { eq, and } from 'drizzle-orm'
import { tenantInvites } from '~~/server/database/schema'
import { canPerformAction } from '~~/server/utils/tenant'

/**
 * DELETE /api/tenants/:uuid/members/invites/:id
 * Revokes (cancels) a pending invitation by setting revokedAt.
 * Requires authentication and manage permission (owner only).
 *
 * @returns Success confirmation.
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }
  requireScope(event, 'members:write')

  const uuid = getRouterParam(event, 'uuid')
  const inviteId = getRouterParam(event, 'id')
  if (!uuid || !inviteId) {
    throw createError({ statusCode: 400, message: 'Tenant ID and invite ID are required' })
  }

  if (!await canPerformAction(uuid, user.id, 'manage')) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const db = useDrizzle()
  const rows = await db.select()
    .from(tenantInvites)
    .where(and(eq(tenantInvites.id, inviteId), eq(tenantInvites.tenantId, uuid)))

  const invite = rows[0]
  if (!invite) {
    throw createError({ statusCode: 404, message: 'Invite not found' })
  }

  if (invite.acceptedAt) {
    throw createError({ statusCode: 409, message: 'Invite has already been accepted' })
  }

  if (invite.revokedAt) {
    throw createError({ statusCode: 409, message: 'Invite has already been revoked' })
  }

  await db.update(tenantInvites)
    .set({ revokedAt: new Date() })
    .where(eq(tenantInvites.id, inviteId))

  await recordAuditLog(event, 'invite.revoke', {
    tenantId: uuid,
    resourceType: 'invite',
    resourceId: inviteId,
    details: { email: invite.email }
  })

  return {
    success: true
  }
})
