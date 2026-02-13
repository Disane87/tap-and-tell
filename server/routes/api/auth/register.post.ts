import { eq } from 'drizzle-orm'
import { users, tenants, tenantMembers, tenantInvites, betaInvites } from '~~/server/database/schema'
import { hashPassword } from '~~/server/utils/password'
import { createSession, setAuthCookies } from '~~/server/utils/session'
import { isBetaModeEnabled, getBetaMode } from '~~/server/utils/beta-config'
import { validateBetaInvite, acceptBetaInvite } from '~~/server/utils/beta'
import { addTenantMember } from '~~/server/utils/tenant'

interface RegisterBody {
  email: string
  password: string
  name: string
  betaToken?: string
  locale?: string
  /** Team invite token — auto-accepts team invite after registration. */
  teamInviteToken?: string
}

/**
 * POST /api/auth/register
 * Registers a new owner account with email, password, and name.
 * Sets HTTP-only cookies for both access token and refresh token.
 *
 * In beta mode (BETA_MODE=private or BETA_MODE=waitlist):
 * - Requires a valid betaToken in the request body
 * - Validates the token exists, is not expired, and not already used
 * - Grants the plan specified in the invite
 * - Sets beta participant and founder flags
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<RegisterBody>(event)

  if (!body?.email || !body?.password || !body?.name) {
    throw createError({ statusCode: 400, message: 'Email, password, and name are required' })
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  const rateCheck = registerLimiter.check(ip)
  if (!rateCheck.allowed) {
    throw createError({ statusCode: 429, message: 'Too many registration attempts. Please try again later.' })
  }

  const email = body.email.trim().toLowerCase()
  const name = sanitizeText(body.name.trim())

  // ── Beta mode check ──
  let betaInvite = null
  if (isBetaModeEnabled()) {
    if (!body.betaToken) {
      throw createError({
        statusCode: 403,
        message: 'Registration is currently invite-only. Please use a valid invite link.',
        data: { betaMode: getBetaMode() }
      })
    }

    betaInvite = await validateBetaInvite(body.betaToken)
    if (!betaInvite) {
      throw createError({
        statusCode: 403,
        message: 'Invalid or expired invite token. Please request a new invite.',
        data: { betaMode: getBetaMode() }
      })
    }

    // Verify the invite email matches the registration email
    if (betaInvite.email !== email) {
      throw createError({
        statusCode: 403,
        message: 'This invite was issued for a different email address.',
        data: { expectedEmail: betaInvite.email }
      })
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, message: 'Invalid email format' })
  }

  const policyResult = validatePasswordPolicy(body.password)
  if (!policyResult.valid) {
    throw createError({ statusCode: 400, message: policyResult.errors.join('. ') })
  }

  if (name.length < 1 || name.length > 100) {
    throw createError({ statusCode: 400, message: 'Name must be between 1 and 100 characters' })
  }

  const db = useDrizzle()

  // Check if email already exists
  const existingRows = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  if (existingRows[0]) {
    throw createError({ statusCode: 409, message: 'Email already registered' })
  }

  const id = generateId()
  const passwordHash = await hashPassword(body.password)

  // Determine locale: invite locale > body locale > detected from header
  const detectedLocale = detectLocaleFromHeader(event)
  const userLocale = betaInvite?.locale || body.locale || detectedLocale || 'en'

  // Create user with beta flags if applicable
  await db.insert(users).values({
    id,
    email,
    passwordHash,
    name,
    locale: userLocale,
    betaInviteId: betaInvite?.id || null,
    betaParticipant: !!betaInvite,
    isFounder: betaInvite?.isFounder || false
  })

  // If beta invite, mark it as accepted and create tenant with granted plan
  if (betaInvite) {
    await acceptBetaInvite(body.betaToken!, id)

    // Create a tenant for the user with the granted plan
    const tenantId = generateId()
    await db.insert(tenants).values({
      id: tenantId,
      name: `${name}'s Guestbook`,
      ownerId: id,
      plan: betaInvite.grantedPlan,
      planGrantedReason: betaInvite.isFounder ? 'founder' : 'beta_invite',
      // Founders get lifetime access, others get 1 year
      planExpiresAt: betaInvite.isFounder ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    })

    // Add owner as member
    await db.insert(tenantMembers).values({
      id: generateId(),
      tenantId,
      userId: id,
      role: 'owner'
    })

    // Send invite_accepted notification to the admin who created the invite (non-blocking)
    try {
      const locale = detectLocaleFromHeader(event)

      // Look up the invite to get createdBy
      const [inviteRecord] = await db
        .select()
        .from(betaInvites)
        .where(eq(betaInvites.token, body.betaToken!))
        .limit(1)

      if (inviteRecord?.createdBy) {
        // Look up admin user
        const [adminUser] = await db
          .select({ id: users.id, email: users.email, name: users.name })
          .from(users)
          .where(eq(users.id, inviteRecord.createdBy))
          .limit(1)

        if (adminUser) {
          const baseUrl = process.env.PUBLIC_URL || 'https://tap-and-tell.com'
          const dateLocale = locale === 'de' ? 'de-DE' : 'en-US'
          sendTemplateEmail(
            'invite_accepted',
            adminUser.email,
            {
              adminName: adminUser.name || adminUser.email.split('@')[0],
              inviteeEmail: email,
              inviteeName: name,
              plan: betaInvite.grantedPlan.toUpperCase(),
              acceptedAt: new Date().toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
              appName: 'Tap & Tell',
              dashboardUrl: `${baseUrl}/_admin/customers`
            },
            {
              locale,
              category: 'notification',
              metadata: { inviteId: betaInvite.id, registeredUserId: id }
            }
          ).catch(() => {
            // Silently ignore — notification failure must not break registration
          })
        }
      }
    } catch {
      // Query failure must not break registration
    }
  }

  // Auto-accept team invite if teamInviteToken is provided
  let teamInviteAccepted = false
  if (body.teamInviteToken) {
    try {
      const [teamInvite] = await db
        .select()
        .from(tenantInvites)
        .where(eq(tenantInvites.token, body.teamInviteToken))
        .limit(1)

      if (teamInvite && !teamInvite.acceptedAt && !teamInvite.revokedAt && new Date(teamInvite.expiresAt) > new Date()) {
        await addTenantMember(teamInvite.tenantId, id, teamInvite.role as 'owner' | 'co_owner', teamInvite.invitedBy)
        await db.update(tenantInvites)
          .set({ acceptedAt: new Date() })
          .where(eq(tenantInvites.id, teamInvite.id))
        teamInviteAccepted = true

        // Notify inviter about acceptance (fire-and-forget)
        const locale = detectLocaleFromHeader(event)
        const baseUrl = process.env.PUBLIC_URL || process.env.APP_URL || 'https://tap-and-tell.com'

        Promise.all([
          db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, teamInvite.invitedBy)),
          db.select({ name: tenants.name }).from(tenants).where(eq(tenants.id, teamInvite.tenantId))
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
                accepteeName: name,
                accepteeEmail: email,
                teamName: tenant?.name || 'your team',
                dashboardUrl: `${baseUrl}/dashboard`
              },
              { locale, category: 'notification', userId: teamInvite.invitedBy, tenantId: teamInvite.tenantId }
            ).catch(() => {
              // Silently ignore — notification failure must not break registration
            })
          }
        }).catch(() => {
          // Query failure must not break registration
        })
      }
    } catch (err) {
      // Team invite acceptance failure must never break registration
      console.error('[register.post] Failed to auto-accept team invite:', err)
    }
  }

  const tokens = await createSession(id, email)
  setAuthCookies(event, tokens)

  await recordAuditLog(event, 'auth.register', {
    userId: id,
    details: {
      email,
      betaInvite: betaInvite ? { id: betaInvite.id, plan: betaInvite.grantedPlan, isFounder: betaInvite.isFounder } : null,
      teamInviteAccepted
    }
  })

  return {
    success: true,
    data: {
      id,
      email,
      name,
      twoFactorEnabled: false,
      betaParticipant: !!betaInvite,
      isFounder: betaInvite?.isFounder || false
    }
  }
})
