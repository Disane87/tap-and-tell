import { eq } from 'drizzle-orm'
import { users } from '~~/server/database/schema'
import { processUpload } from '~~/server/utils/upload'

/**
 * POST /api/auth/avatar
 * Uploads a new avatar image for the current user.
 * Accepts multipart/form-data with a single file field named "avatar".
 *
 * @returns {{ success: boolean, data: { avatarUrl: string } }}
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No file uploaded' })
  }

  const file = formData.find(f => f.name === 'avatar')
  if (!file || !file.data) {
    throw createError({ statusCode: 400, message: 'Avatar file required' })
  }

  try {
    const result = await processUpload(Buffer.from(file.data), {
      directory: 'avatars',
      filePrefix: user.id,
      urlPrefix: '/api/auth/avatar',
      encrypt: false,
      deleteExisting: true,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    })

    // Avatar URL with cache-busting timestamp to prevent browser caching issues on re-upload
    const avatarUrl = `/api/auth/avatar/${user.id}?v=${Date.now()}`

    const db = useDrizzle()
    await db.update(users)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(users.id, user.id))

    return { success: true, data: { avatarUrl } }
  } catch (error) {
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Upload failed'
    })
  }
})
