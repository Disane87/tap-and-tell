import { eq, and, gt } from 'drizzle-orm'
import { sessions, users } from '~~/server/database/schema'
import { createAccessToken, createRefreshToken, verifyJwt } from '~~/server/utils/jwt'

/**
 * Return type for session creation and refresh operations.
 */
export interface SessionTokens {
  /** Short-lived access token (15 minutes). */
  accessToken: string
  /** Long-lived refresh token (7 days), stored in the database for revocation. */
  refreshToken: string
}

/**
 * Creates a new session for a user.
 * Generates a short-lived access token and a long-lived refresh token.
 * The refresh token is stored in the sessions table for revocation support.
 *
 * @param userId - The user ID.
 * @param email - The user email.
 * @returns Both the access token and refresh token.
 */
export async function createSession(userId: string, email: string): Promise<SessionTokens> {
  const db = useDrizzle()
  const accessToken = await createAccessToken({ sub: userId, email })
  const refreshToken = await createRefreshToken({ sub: userId, email })
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await db.insert(sessions).values({
    id: generateId(),
    userId,
    token: refreshToken,
    expiresAt
  })

  return { accessToken, refreshToken }
}

/**
 * Validates an access token by verifying its JWT signature and expiry.
 * This is a stateless check - no database lookup is performed.
 *
 * @param token - The access token JWT to validate.
 * @returns The user info (id, email, name) or null if invalid/expired.
 */
export async function validateAccessToken(token: string) {
  const payload = await verifyJwt(token, 'access')
  if (!payload) return null

  const db = useDrizzle()
  const userRows = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    avatarUrl: users.avatarUrl
  })
    .from(users)
    .where(eq(users.id, payload.sub))

  return userRows[0] || null
}

/**
 * Validates a session token and returns the associated user.
 * Checks both JWT validity and database session existence.
 *
 * @deprecated Use validateAccessToken for access tokens and refreshSession for refresh tokens.
 * @param token - The JWT token to validate.
 * @returns The user object or null if invalid.
 */
export async function validateSession(token: string) {
  // Try as access token first (stateless)
  const accessUser = await validateAccessToken(token)
  if (accessUser) return accessUser

  // Fall back to legacy behavior: check DB for the token
  const payload = await verifyJwt(token)
  if (!payload) return null

  const db = useDrizzle()
  const now = new Date()

  const sessionRows = await db.select()
    .from(sessions)
    .where(
      and(
        eq(sessions.token, token),
        gt(sessions.expiresAt, now)
      )
    )

  const session = sessionRows[0]
  if (!session) return null

  const userRows = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    avatarUrl: users.avatarUrl
  })
    .from(users)
    .where(eq(users.id, session.userId))

  return userRows[0] || null
}

/**
 * Refreshes a session using a refresh token.
 * Verifies the refresh token JWT, looks up the session in the database,
 * generates a new access token and rotates the refresh token.
 *
 * @param refreshTokenStr - The refresh token JWT string.
 * @returns New access and refresh tokens, or null if invalid.
 */
export async function refreshSession(refreshTokenStr: string): Promise<SessionTokens | null> {
  const payload = await verifyJwt(refreshTokenStr, 'refresh')
  if (!payload) return null

  const db = useDrizzle()
  const now = new Date()

  // Look up session by refresh token
  const sessionRows = await db.select()
    .from(sessions)
    .where(
      and(
        eq(sessions.token, refreshTokenStr),
        gt(sessions.expiresAt, now)
      )
    )

  const session = sessionRows[0]
  if (!session) return null

  // Generate new tokens
  const newAccessToken = await createAccessToken({ sub: payload.sub, email: payload.email })
  const newRefreshToken = await createRefreshToken({ sub: payload.sub, email: payload.email })
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  // Rotate the refresh token in the database
  await db.update(sessions)
    .set({
      token: newRefreshToken,
      expiresAt: newExpiresAt
    })
    .where(eq(sessions.id, session.id))

  return { accessToken: newAccessToken, refreshToken: newRefreshToken }
}

/**
 * Deletes a session by its refresh token.
 *
 * @param refreshTokenStr - The refresh token to invalidate.
 */
export async function deleteSession(refreshTokenStr: string): Promise<void> {
  const db = useDrizzle()
  await db.delete(sessions).where(eq(sessions.token, refreshTokenStr))
}

/**
 * Deletes all sessions for a user (e.g. on password change).
 *
 * @param userId - The user ID whose sessions should be invalidated.
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  const db = useDrizzle()
  await db.delete(sessions).where(eq(sessions.userId, userId))
}
