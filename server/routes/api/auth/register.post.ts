import { eq } from 'drizzle-orm'
import { users, tenants, tenantMembers } from '~~/server/database/schema'
import { hashPassword } from '~~/server/utils/password'
import { createSession, setAuthCookies } from '~~/server/utils/session'
import { isBetaModeEnabled, getBetaMode } from '~~/server/utils/beta-config'
import { validateBetaInvite, acceptBetaInvite } from '~~/server/utils/beta'

interface RegisterBody {
  email: string
  password: string
  name: string
  betaToken?: string
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

  // Create user with beta flags if applicable
  await db.insert(users).values({
    id,
    email,
    passwordHash,
    name,
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
  }

  const tokens = await createSession(id, email)
  setAuthCookies(event, tokens)

  await recordAuditLog(event, 'auth.register', {
    userId: id,
    details: {
      email,
      betaInvite: betaInvite ? { id: betaInvite.id, plan: betaInvite.grantedPlan, isFounder: betaInvite.isFounder } : null
    }
  })

  return {
    success: true,
    data: {
      id,
      email,
      name,
      betaParticipant: !!betaInvite,
      isFounder: betaInvite?.isFounder || false
    }
  }
})
