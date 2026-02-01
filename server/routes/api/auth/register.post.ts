import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { users } from '~~/server/database/schema'
import { hashPassword } from '~~/server/utils/password'
import { createSession } from '~~/server/utils/session'

/**
 * POST /api/auth/register
 * Registers a new owner account with email, password, and name.
 * Sets HTTP-only cookies for both access token and refresh token.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email: string; password: string; name: string }>(event)

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

  const db = useDb()

  // Check if email already exists
  const existingRows = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  if (existingRows[0]) {
    throw createError({ statusCode: 409, message: 'Email already registered' })
  }

  const id = generateId()
  const passwordHash = await hashPassword(body.password)

  await db.insert(users).values({
    id,
    email,
    passwordHash,
    name
  })

  const { accessToken, refreshToken } = await createSession(id, email)

  setCookie(event, 'auth_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60, // 15 minutes
    path: '/'
  })

  setCookie(event, 'refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  })

  await recordAuditLog(event, 'auth.register', { userId: id, details: { email } })

  return {
    success: true,
    data: { id, email, name }
  }
})
