import { eq } from 'drizzle-orm'
import { tenantInvites, tenants, users } from '~~/server/database/schema'
import { canPerformAction } from '~~/server/utils/tenant'
import { sendTemplateEmail, detectLocaleFromHeader } from '~~/server/utils/email-service'
import { isBetaModeEnabled } from '~~/server/utils/beta-config'
import { createBetaInvite, getBetaInviteByEmail } from '~~/server/utils/beta'

/**
 * POST /api/tenants/:uuid/members/invite
 * Creates an invitation for a user to join a tenant as co_owner.
 * Requires authentication and manage permission (owner only).
 *
 * @body { email: string } - Email of the user to invite.
 * @returns The created invite object with a unique token.
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }
  requireScope(event, 'members:write')

  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) {
    throw createError({ statusCode: 400, message: 'Tenant ID is required' })
  }

  if (!await canPerformAction(uuid, user.id, 'manage')) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const body = await readBody<{ email: string }>(event)
  if (!body?.email || typeof body.email !== 'string' || !body.email.includes('@')) {
    throw createError({ statusCode: 400, message: 'Valid email is required' })
  }

  const db = useDrizzle()

  // Check tenant exists
  const tenantRows = await db.select({ id: tenants.id, name: tenants.name })
    .from(tenants)
    .where(eq(tenants.id, uuid))

  const tenant = tenantRows[0]

  if (!tenant) {
    throw createError({ statusCode: 404, message: 'Tenant not found' })
  }

  const id = generateId()
  const token = generateId()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await db.insert(tenantInvites).values({
    id,
    tenantId: uuid,
    email: body.email.trim().toLowerCase(),
    role: 'co_owner',
    invitedBy: user.id,
    token,
    expiresAt,
    createdAt: now
  })

  await recordAuditLog(event, 'member.add', { tenantId: uuid, resourceType: 'invite', resourceId: id, details: { email: body.email.trim().toLowerCase() } })

  const inviteeEmail = body.email.trim().toLowerCase()

  // Check if the invited user already has an account
  const existingUserRows = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.email, inviteeEmail))
  const userExists = !!existingUserRows[0]

  // Prepare invite email
  const locale = detectLocaleFromHeader(event)
  const baseUrl = process.env.PUBLIC_URL || process.env.APP_URL || 'https://tap-and-tell.com'

  // Load inviter details for the email
  const inviterRows = await db.select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, user.id))
  const inviter = inviterRows[0]

  // Determine invite URL based on user existence and beta mode
  let inviteUrl: string
  if (userExists) {
    // User exists → link to accept-invite page
    inviteUrl = `${baseUrl}/accept-invite?token=${token}`
  } else if (isBetaModeEnabled()) {
    // User doesn't exist + beta mode → create beta invite + link to register with both tokens
    let betaInvite = await getBetaInviteByEmail(inviteeEmail)
    if (!betaInvite) {
      betaInvite = await createBetaInvite({
        email: inviteeEmail,
        grantedPlan: 'free',
        isFounder: false,
        note: `Co-owner invite for: ${tenant.name}`,
        expiresInDays: 7,
        source: 'manual'
      })
    }
    inviteUrl = `${baseUrl}/register?token=${betaInvite.token}&teamInvite=${token}`
  } else {
    // User doesn't exist + no beta → link to register with teamInvite token
    inviteUrl = `${baseUrl}/register?teamInvite=${token}`
  }

  // Send invite email (fire-and-forget)
  sendTemplateEmail(
    locale === 'de' ? 'team_invite_de' : 'team_invite',
    inviteeEmail,
    {
      appName: 'Tap & Tell',
      inviterName: inviter?.name || user.name || 'A team member',
      inviterEmail: inviter?.email || '',
      teamName: tenant.name,
      inviteUrl,
      expiresIn: '7 days'
    },
    { locale, category: 'transactional', userId: user.id, tenantId: uuid }
  ).catch((err) => {
    console.error('[invite.post] Failed to send invite email:', err)
  })

  return {
    success: true,
    data: {
      id,
      tenantId: uuid,
      email: inviteeEmail,
      role: 'co_owner',
      token,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString()
    },
    userExists
  }
})
