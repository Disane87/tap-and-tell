import { createHash, randomBytes } from 'crypto'
import { eq, and, isNull } from 'drizzle-orm'
import { apiApps, apiTokens } from '~~/server/database/schema'
import type { ApiScope } from '~~/server/database/schema'

/**
 * Token prefix for Tap & Tell API tokens.
 * Makes tokens easily identifiable (like GitHub's ghp_ prefix).
 */
const TOKEN_PREFIX = 'tat_'

/**
 * All valid API scopes.
 */
export const ALL_SCOPES: ApiScope[] = [
  'entries:read',
  'entries:write',
  'guestbooks:read',
  'guestbooks:write',
  'tenant:read',
  'tenant:write',
  'members:read',
  'members:write',
  'photos:read'
]

/**
 * Human-readable scope descriptions for UI display.
 */
export const SCOPE_DESCRIPTIONS: Record<ApiScope, string> = {
  'entries:read': 'Read guestbook entries (approved and all)',
  'entries:write': 'Create, update, and delete guestbook entries',
  'guestbooks:read': 'Read guestbook details and settings',
  'guestbooks:write': 'Create, update, and delete guestbooks',
  'tenant:read': 'Read tenant information',
  'tenant:write': 'Update tenant settings',
  'members:read': 'Read tenant member list',
  'members:write': 'Manage members and invitations',
  'photos:read': 'Read and decrypt photos'
}

/**
 * Generates a new API token with the tat_ prefix.
 * Returns the plaintext token (shown once) and its SHA-256 hash (stored in DB).
 *
 * @returns Object with plaintext token, its hash, and the display prefix.
 */
export function generateApiToken(): { plaintext: string; hash: string; prefix: string } {
  const random = randomBytes(20).toString('hex') // 40 hex chars = 160 bits
  const plaintext = `${TOKEN_PREFIX}${random}`
  const hash = hashToken(plaintext)
  const prefix = plaintext.substring(0, 8) // e.g. "tat_a1b2"

  return { plaintext, hash, prefix }
}

/**
 * Hashes a token using SHA-256.
 *
 * @param token - The plaintext API token.
 * @returns The hex-encoded SHA-256 hash.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Checks whether a string looks like a Tap & Tell API token.
 *
 * @param token - The string to check.
 * @returns True if it starts with the tat_ prefix.
 */
export function isApiToken(token: string): boolean {
  return token.startsWith(TOKEN_PREFIX)
}

/**
 * Validates an API token and returns the associated app, scopes, and tenant context.
 * Also updates the last_used_at timestamp.
 *
 * @param token - The plaintext API token.
 * @returns The validated token context, or null if invalid/expired/revoked.
 */
export async function validateApiToken(token: string): Promise<ApiTokenContext | null> {
  if (!isApiToken(token)) return null

  const tokenHash = hashToken(token)
  const db = useDrizzle()

  // Look up token by hash — joined with app for tenant info
  const rows = await db.select({
    tokenId: apiTokens.id,
    appId: apiTokens.appId,
    tokenName: apiTokens.name,
    scopes: apiTokens.scopes,
    expiresAt: apiTokens.expiresAt,
    revokedAt: apiTokens.revokedAt,
    appName: apiApps.name,
    tenantId: apiApps.tenantId,
    userId: apiApps.userId
  })
    .from(apiTokens)
    .innerJoin(apiApps, eq(apiTokens.appId, apiApps.id))
    .where(eq(apiTokens.tokenHash, tokenHash))

  const row = rows[0]
  if (!row) return null

  // Check if revoked
  if (row.revokedAt) return null

  // Check if expired
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null

  // Update last_used_at (fire-and-forget)
  db.update(apiTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiTokens.id, row.tokenId))
    .catch(() => { /* ignore errors */ })

  return {
    tokenId: row.tokenId,
    appId: row.appId,
    appName: row.appName,
    tokenName: row.tokenName,
    tenantId: row.tenantId,
    userId: row.userId,
    scopes: (row.scopes as string[]) || []
  }
}

/**
 * Validates that a set of scopes are all valid.
 *
 * @param scopes - Array of scope strings to validate.
 * @returns True if all scopes are valid.
 */
export function validateScopes(scopes: string[]): scopes is ApiScope[] {
  return scopes.every(s => (ALL_SCOPES as string[]).includes(s))
}

/**
 * Checks whether a token context has a specific scope.
 *
 * @param context - The API token context from validation.
 * @param scope - The required scope.
 * @returns True if the scope is granted.
 */
export function hasScope(context: ApiTokenContext, scope: ApiScope): boolean {
  return context.scopes.includes(scope)
}

/**
 * Checks if the current request has the required scope.
 * Works for both API token auth and cookie auth.
 * Cookie-authenticated users always have all scopes.
 * Throws 403 if the scope is not granted.
 *
 * @param event - The H3 event.
 * @param scope - The required scope.
 */
export function requireScope(event: { context: Record<string, unknown> }, scope: ApiScope): void {
  // Cookie-authenticated users (event.context.user) have full access
  if (event.context.user && !event.context.apiApp) return

  // API token-authenticated requests must have the scope
  const apiApp = event.context.apiApp as ApiTokenContext | undefined
  if (!apiApp) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  if (!hasScope(apiApp, scope)) {
    throw createError({
      statusCode: 403,
      message: `Insufficient scope. Required: ${scope}. Granted: ${apiApp.scopes.join(', ') || 'none'}`
    })
  }
}

/**
 * Context object attached to event.context.apiApp after API token validation.
 */
export interface ApiTokenContext {
  /** Database ID of the token. */
  tokenId: string
  /** Database ID of the app. */
  appId: string
  /** App name. */
  appName: string
  /** Token name. */
  tokenName: string
  /** Tenant ID this token is scoped to. */
  tenantId: string
  /** User ID who created the app. */
  userId: string
  /** Granted scopes. */
  scopes: string[]
}
