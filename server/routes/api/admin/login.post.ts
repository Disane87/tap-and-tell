/**
 * POST /api/admin/login
 * Authenticates with admin password and returns a signed token.
 */
export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  const rateCheck = adminLoginLimiter.check(ip)
  if (!rateCheck.allowed) {
    throw createError({
      statusCode: 429,
      message: 'Too many login attempts. Please try again later.'
    })
  }

  const body = await readBody<{ password: string }>(event)

  if (!body.password || typeof body.password !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'Password is required'
    })
  }

  if (!validatePassword(body.password)) {
    throw createError({
      statusCode: 401,
      message: 'Invalid password'
    })
  }

  const token = generateToken()

  return {
    success: true,
    token
  }
})
