import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { tenantInvites } from '~~/server/database/schema'
import { addTenantMember, getUserTenantRole } from '~~/server/utils/tenant'
import type { TenantRole } from '~~/server/database/schema'

/**
 * POST /api/invites/accept
 * Accepts a tenant invitation. Requires authentication.
 * The authenticated user becomes a member of the tenant with the invite's role.
 *
 * @body { token: string } - The invitation token.
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const body = await readBody<{ token: string }>(event)
  if (!body?.token || typeof body.token !== 'string') {
    throw createError({ statusCode: 400, message: 'Token is required' })
  }

  const db = useDb()
  const invite = db.select().from(tenantInvites).where(eq(tenantInvites.token, body.token)).get()

  if (!invite) {
    throw createError({ statusCode: 404, message: 'Invite not found' })
  }

  if (invite.acceptedAt) {
    throw createError({ statusCode: 410, message: 'Invite already accepted' })
  }

  if (new Date(invite.expiresAt) < new Date()) {
    throw createError({ statusCode: 410, message: 'Invite has expired' })
  }

  // Check if user is already a member
  const existingRole = getUserTenantRole(invite.tenantId, user.id)
  if (existingRole) {
    throw createError({ statusCode: 409, message: 'Already a member of this tenant' })
  }

  // Add user as member
  addTenantMember(invite.tenantId, user.id, invite.role as TenantRole, invite.invitedBy)

  // Mark invite as accepted
  db.update(tenantInvites)
    .set({ acceptedAt: new Date().toISOString() })
    .where(eq(tenantInvites.id, invite.id))
    .run()

  return {
    success: true,
    data: {
      tenantId: invite.tenantId,
      role: invite.role
    }
  }
})
