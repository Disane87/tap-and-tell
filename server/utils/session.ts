import { randomUUID } from 'crypto'
import { eq, and, gt } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { sessions, users } from '~~/server/database/schema'
import { createJwt, verifyJwt } from '~~/server/utils/jwt'

/**
 * Creates a new session for a user.
 * Generates a JWT token and stores it in the sessions table.
 *
 * @param userId - The user ID.
 * @param email - The user email.
 * @returns The JWT token string.
 */
export async function createSession(userId: string, email: string): Promise<string> {
  const db = useDb()
  const token = await createJwt({ sub: userId, email })
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  db.insert(sessions).values({
    id: randomUUID(),
    userId,
    token,
    expiresAt
  }).run()

  return token
}

/**
 * Validates a session token and returns the associated user.
 * Checks both JWT validity and database session existence.
 *
 * @param token - The JWT token to validate.
 * @returns The user object or null if invalid.
 */
export async function validateSession(token: string) {
  const payload = await verifyJwt(token)
  if (!payload) return null

  const db = useDb()
  const now = new Date().toISOString()

  const session = db.select()
    .from(sessions)
    .where(
      and(
        eq(sessions.token, token),
        gt(sessions.expiresAt, now)
      )
    )
    .get()

  if (!session) return null

  const user = db.select({
    id: users.id,
    email: users.email,
    name: users.name
  })
    .from(users)
    .where(eq(users.id, session.userId))
    .get()

  return user || null
}

/**
 * Deletes a session by token.
 *
 * @param token - The JWT token to invalidate.
 */
export async function deleteSession(token: string): Promise<void> {
  const db = useDb()
  db.delete(sessions).where(eq(sessions.token, token)).run()
}
