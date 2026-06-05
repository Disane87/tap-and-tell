import { defineEventHandler, getRequestURL, createError } from 'h3'
import { eq, and } from 'drizzle-orm'
import { userTwoFactor } from '~~/server/database/schema'
import { useDrizzle } from '#imports'

/**
 * Paths that are exempt from 2FA enforcement. These are genuine
 * public / bootstrap endpoints that must remain reachable without 2FA
 * (otherwise users could never log in, set up 2FA, or access public guest data).
 *
 * Everything NOT matching this allow-list requires an enabled 2FA factor when
 * the request is authenticated — i.e. enforcement is opt-out, not opt-in.
 */
const PUBLIC_PATH_PREFIXES = [
  '/api/auth/', // login, register, logout, refresh, 2fa/*, password reset, etc.
  '/api/csrf', // CSRF token bootstrap
  '/api/g/', // public flat guest routes
  '/api/t/', // legacy public guest routes
  '/api/photos', // public photo serving
  '/api/health', // health checks
  '/api/admin/' // legacy admin routes (own auth)
]

/**
 * Middleware that enforces 2FA for authenticated users.
 *
 * Uses an allow-list approach: every authenticated request is required to have
 * an enabled 2FA factor EXCEPT for genuine public / bootstrap paths
 * (see {@link PUBLIC_PATH_PREFIXES}). This closes the gap where only
 * `/api/tenants*` and `/api/entries` were protected, leaving other
 * authenticated endpoints (e.g. profile, API apps, exports) accessible without 2FA.
 *
 * The 2FA endpoints themselves live under `/api/auth/` and are therefore exempt,
 * so users can never be locked out of setting up or verifying 2FA.
 *
 * In development mode (NODE_ENV !== 'production'), 2FA enforcement is skipped
 * to simplify local development workflow.
 */
export default defineEventHandler(async (event) => {
  // Skip 2FA enforcement in development mode
  if (process.env.NODE_ENV !== 'production') return

  const user = event.context.user
  if (!user) return // Not authenticated, let other middleware handle it

  // API token-authenticated requests bypass 2FA (2FA was verified at app creation time)
  if (event.context.apiApp) return

  const path = getRequestURL(event).pathname

  // Only enforce on API routes; non-API (page) routes are handled client-side.
  if (!path.startsWith('/api/')) return

  // Allow genuine public / bootstrap endpoints.
  if (PUBLIC_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))) return

  // Every other authenticated API request requires an enabled 2FA factor.
  const db = useDrizzle()
  const tfaRows = await db.select().from(userTwoFactor)
    .where(and(eq(userTwoFactor.userId, user.id), eq(userTwoFactor.enabled, 'true')))

  if (!tfaRows[0]) {
    throw createError({
      statusCode: 403,
      message: 'Two-factor authentication is required. Please set up 2FA in your security settings.'
    })
  }
})
