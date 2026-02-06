import { joinWaitlist } from '~~/server/utils/beta'
import { isWaitlistOpen, getBetaMode } from '~~/server/utils/beta-config'

interface JoinWaitlistBody {
  email: string
  name?: string
  useCase?: string
  referralCode?: string
  source?: string
}

// Simple in-memory rate limiter for waitlist joins
const waitlistLimiter = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 5 // 5 signups per IP per hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = waitlistLimiter.get(ip)

  if (!entry || now > entry.resetAt) {
    waitlistLimiter.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }

  entry.count++
  return true
}

/**
 * POST /api/waitlist/join
 * Joins the beta waitlist.
 *
 * Body:
 * - email: string (required)
 * - name: string (optional)
 * - useCase: string (optional, e.g., "Wedding", "Corporate event")
 * - referralCode: string (optional, boosts referrer's priority)
 * - source: string (optional, traffic source)
 *
 * Public endpoint - no authentication required.
 * Rate limited by IP address.
 */
export default defineEventHandler(async (event) => {
  // Check if waitlist is open
  if (!isWaitlistOpen()) {
    throw createError({
      statusCode: 403,
      message: 'Waitlist is not currently open.',
      data: { betaMode: getBetaMode() }
    })
  }

  const body = await readBody<JoinWaitlistBody>(event)

  if (!body?.email) {
    throw createError({ statusCode: 400, message: 'Email is required' })
  }

  const email = body.email.trim().toLowerCase()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, message: 'Invalid email format' })
  }

  // Rate limiting
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  if (!checkRateLimit(ip)) {
    throw createError({
      statusCode: 429,
      message: 'Too many requests. Please try again later.'
    })
  }

  const result = await joinWaitlist({
    email,
    name: body.name,
    useCase: body.useCase,
    source: body.source || 'organic',
    referralCode: body.referralCode
  })

  // Send confirmation email (non-blocking, only for new signups)
  if (!result.alreadyExists) {
    try {
      const locale = detectLocaleFromHeader(event)
      const siteUrl = process.env.PUBLIC_URL || useRuntimeConfig().public?.siteUrl || 'https://localhost:3000'
      const referralLink = `${siteUrl}/?ref=${result.referralCode}`

      await sendTemplateEmail(
        'waitlist_confirmation',
        email,
        {
          name: body.name || email.split('@')[0],
          position: String(result.position),
          referralCode: result.referralCode,
          referralLink,
          appName: 'Tap & Tell'
        },
        {
          locale,
          category: 'waitlist',
          metadata: { position: result.position }
        }
      )
    } catch (emailError) {
      // Email failure should NOT block the waitlist join response
      console.warn('[Waitlist] Failed to send confirmation email:', emailError)
    }
  }

  return {
    success: true,
    data: {
      position: result.position,
      referralCode: result.referralCode,
      alreadyExists: result.alreadyExists
    }
  }
})
