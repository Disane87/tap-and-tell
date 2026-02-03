import { revokeBetaInvite } from '~~/server/utils/beta'

/**
 * DELETE /api/admin/beta-invites/[id]
 * Revokes (deletes) an unused beta invite.
 *
 * Only unused invites can be revoked.
 *
 * Requires admin authentication.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Invite ID is required' })
  }

  const revoked = await revokeBetaInvite(id)

  if (!revoked) {
    throw createError({
      statusCode: 404,
      message: 'Invite not found or already used'
    })
  }

  const user = event.context.user as { id: string; email: string }
  await recordAuditLog(event, 'beta.invite_revoked', {
    userId: user.id,
    details: { inviteId: id }
  })

  return {
    success: true,
    message: 'Invite revoked successfully'
  }
})
