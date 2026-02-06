import { eq } from 'drizzle-orm'
import { users } from '~~/server/database/schema'
import { sanitizeText } from '~~/server/utils/sanitize'
import { recordAuditLog } from '~~/server/utils/audit'

/**
 * PUT /api/auth/me
 * Updates the current user's name and/or email.
 *
 * @body {{ name?: string, email?: string, locale?: string }}
 * @returns {{ success: boolean, data: { id, email, name, avatarUrl, locale, twoFactorEnabled } }}
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const body = await readBody<{ name?: string; email?: string; locale?: string }>(event)
  if (!body || (!body.name && !body.email && !body.locale)) {
    throw createError({ statusCode: 400, message: 'Name, email or locale required' })
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date()
  }

  if (body.name !== undefined) {
    const name = sanitizeText(body.name.trim())
    if (name.length < 1 || name.length > 100) {
      throw createError({ statusCode: 400, message: 'Name must be 1-100 characters' })
    }
    updates.name = name
  }

  if (body.email !== undefined) {
    const email = body.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw createError({ statusCode: 400, message: 'Invalid email format' })
    }

    // Check uniqueness
    const db = useDrizzle()
    const existing = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
    if (existing.length > 0 && existing[0].id !== user.id) {
      throw createError({ statusCode: 409, message: 'Email already in use' })
    }
    updates.email = email
  }

  if (body.locale !== undefined) {
    const locale = body.locale.trim().toLowerCase()
    if (!['en', 'de'].includes(locale)) {
      throw createError({ statusCode: 400, message: 'Locale must be "en" or "de"' })
    }
    updates.locale = locale
  }

  const db = useDrizzle()
  const updated = await db.update(users)
    .set(updates)
    .where(eq(users.id, user.id))
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      avatarUrl: users.avatarUrl,
      locale: users.locale
    })

  if (!updated.length) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  recordAuditLog(event, 'auth.profile_update', {
    userId: user.id,
    resourceType: 'user',
    resourceId: user.id,
    details: { fields: Object.keys(updates).filter(k => k !== 'updatedAt') }
  })

  return {
    success: true,
    data: {
      ...updated[0],
      twoFactorEnabled: user.twoFactorEnabled ?? false
    }
  }
})
