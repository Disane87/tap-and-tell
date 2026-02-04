import { eq } from 'drizzle-orm'
import { join } from 'path'
import { users } from '~~/server/database/schema'
import { getStorageDriver } from '~~/server/utils/storage-driver'

/**
 * DELETE /api/auth/avatar
 * Deletes the current user's avatar image.
 * Uses the storage driver abstraction for cloud compatibility.
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
  const storage = getStorageDriver()

  // Find and delete avatar file(s) matching the user ID using storage driver
  const avatarPrefix = join(avatarDir, `${user.id}.`)
  const avatarFiles = await storage.list(avatarPrefix)

  for (const file of avatarFiles) {
    await storage.delete(file).catch(() => {})
  }

  const db = useDrizzle()
  await db.update(users)
    .set({ avatarUrl: null, updatedAt: new Date() })
    .where(eq(users.id, user.id))

  return { success: true }
})
