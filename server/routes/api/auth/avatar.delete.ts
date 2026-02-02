import { eq } from 'drizzle-orm'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync, readdirSync } from 'fs'
import { users } from '~~/server/database/schema'

/**
 * DELETE /api/auth/avatar
 * Deletes the current user's avatar image.
 *
 * @returns {{ success: boolean }}
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const dataDir = process.env.DATA_DIR || '.data'
  const avatarDir = join(dataDir, 'avatars')

  // Delete avatar file(s) matching the user ID
  if (existsSync(avatarDir)) {
    const files = readdirSync(avatarDir)
    for (const file of files) {
      if (file.startsWith(`${user.id}.`)) {
        await unlink(join(avatarDir, file)).catch(() => {})
      }
    }
  }

  const db = useDrizzle()
  await db.update(users)
    .set({ avatarUrl: null, updatedAt: new Date() })
    .where(eq(users.id, user.id))

  return { success: true }
})
