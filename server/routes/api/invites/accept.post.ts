import { eq } from 'drizzle-orm'
import { tenantInvites, users, tenants } from '~~/server/database/schema'
import { addTenantMember, getUserTenantRole } from '~~/server/utils/tenant'
import { sendTemplateEmail, detectLocaleFromHeader } from '~~/server/utils/email-service'
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

  const db = useDrizzle()
  const inviteRows = await db.select().from(tenantInvites).where(eq(tenantInvites.token, body.token))
  const invite = inviteRows[0]

  if (!invite) {
    throw createError({ statusCode: 404, message: 'Invite not found' })
  }

  if (invite.acceptedAt) {
    throw createError({ statusCode: 410, message: 'Invite already accepted' })
  }

  if (invite.revokedAt) {
    throw createError({ statusCode: 410, message: 'Invite has been revoked' })
  }

  if (new Date(invite.expiresAt) < new Date()) {
    throw createError({ statusCode: 410, message: 'Invite has expired' })
  }

  // Check if user is already a member
  const existingRole = await getUserTenantRole(invite.tenantId, user.id)
  if (existingRole) {
    throw createError({ statusCode: 409, message: 'Already a member of this tenant' })
  }

  // Add user as member
  await addTenantMember(invite.tenantId, user.id, invite.role as TenantRole, invite.invitedBy)

  // Mark invite as accepted
  await db.update(tenantInvites)
    .set({ acceptedAt: new Date() })
    .where(eq(tenantInvites.id, invite.id))

  // Notify the inviter that the invitation was accepted (fire-and-forget)
  const locale = detectLocaleFromHeader(event)
  const baseUrl = process.env.PUBLIC_URL || process.env.APP_URL || 'https://tap-and-tell.com'

  Promise.all([
    db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, invite.invitedBy)),
    db.select({ name: tenants.name }).from(tenants).where(eq(tenants.id, invite.tenantId))
  ]).then(([inviterRows, tenantRows]) => {
    const inviter = inviterRows[0]
    const tenant = tenantRows[0]
    if (inviter?.email) {
      sendTemplateEmail(
        locale === 'de' ? 'team_invite_accepted_de' : 'team_invite_accepted',
        inviter.email,
        {
          appName: 'Tap & Tell',
          inviterName: inviter.name || 'Team Owner',
          accepteeName: user.name || 'A user',
          accepteeEmail: user.email || '',
          teamName: tenant?.name || 'your team',
          dashboardUrl: `${baseUrl}/dashboard`
        },
        { locale, category: 'notification', userId: invite.invitedBy, tenantId: invite.tenantId }
      ).catch((err) => {
        console.error('[accept.post] Failed to send acceptance notification:', err)
      })
    }
  }).catch((err) => {
    console.error('[accept.post] Failed to load inviter/tenant for notification:', err)
  })

  return {
    success: true,
    data: {
      tenantId: invite.tenantId,
      role: invite.role
    }
  }
})
