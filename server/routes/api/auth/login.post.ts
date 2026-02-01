import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { users } from '~~/server/database/schema'
import { verifyPassword } from '~~/server/utils/password'
import { createSession } from '~~/server/utils/session'

/**
 * POST /api/auth/login
 * Authenticates an owner with email and password.
 * Sets an HTTP-only auth cookie on success.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email: string; password: string }>(event)

  if (!body?.email || !body?.password) {
    throw createError({ statusCode: 400, message: 'Email and password are required' })
  }

  const email = body.email.trim().toLowerCase()
  const db = useDb()

  const rows = await db.select().from(users).where(eq(users.email, email))
  const user = rows[0]
  if (!user) {
    throw createError({ statusCode: 401, message: 'Invalid email or password' })
  }

  // Migrated users without proper password can't log in
  if (user.passwordHash === 'migrated:no-login') {
    throw createError({ statusCode: 401, message: 'Invalid email or password' })
  }

  const valid = await verifyPassword(body.password, user.passwordHash)
  if (!valid) {
    throw createError({ statusCode: 401, message: 'Invalid email or password' })
  }

  const token = await createSession(user.id, user.email)

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/'
  })

  return {
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  }
})
