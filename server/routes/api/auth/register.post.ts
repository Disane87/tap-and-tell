import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { users } from '~~/server/database/schema'
import { hashPassword } from '~~/server/utils/password'
import { createSession } from '~~/server/utils/session'

/**
 * POST /api/auth/register
 * Registers a new owner account with email, password, and name.
 * Sets an HTTP-only auth cookie on success.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email: string; password: string; name: string }>(event)

  if (!body?.email || !body?.password || !body?.name) {
    throw createError({ statusCode: 400, message: 'Email, password, and name are required' })
  }

  const email = body.email.trim().toLowerCase()
  const name = body.name.trim()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, message: 'Invalid email format' })
  }

  if (body.password.length < 8) {
    throw createError({ statusCode: 400, message: 'Password must be at least 8 characters' })
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

  const token = await createSession(id, email)

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/'
  })

  return {
    success: true,
    data: { id, email, name }
  }
})
