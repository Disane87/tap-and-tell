import { eq } from 'drizzle-orm'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { users } from '~~/server/database/schema'
import { MAX_AVATAR_SIZE, formatSize } from '~~/server/utils/image-config'

/** Allowed MIME types and their file extensions. */
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
}

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
  if (!file || !file.data || !file.type) {
    throw createError({ statusCode: 400, message: 'Avatar file required' })
  }

  if (file.data.length > MAX_AVATAR_SIZE) {
    throw createError({ statusCode: 400, message: `File too large (max ${formatSize(MAX_AVATAR_SIZE)})` })
  }

  const ext = ALLOWED_TYPES[file.type]
  if (!ext) {
    throw createError({ statusCode: 400, message: 'Unsupported image type. Use JPEG, PNG, or WebP.' })
  }

  // Validate magic bytes
  const bytes = new Uint8Array(file.data)
  if (!isValidImage(bytes, file.type)) {
    throw createError({ statusCode: 400, message: 'Invalid image data' })
  }

  const dataDir = process.env.DATA_DIR || '.data'
  const avatarDir = join(dataDir, 'avatars')
  await mkdir(avatarDir, { recursive: true })

  const filename = `${user.id}.${ext}`
  const filepath = join(avatarDir, filename)
  await writeFile(filepath, file.data)

  const avatarUrl = `/api/auth/avatar/${user.id}`

  const db = useDrizzle()
  await db.update(users)
    .set({ avatarUrl, updatedAt: new Date() })
    .where(eq(users.id, user.id))

  return { success: true, data: { avatarUrl } }
})

/**
 * Validates image magic bytes match the declared MIME type.
 */
function isValidImage(bytes: Uint8Array, mimeType: string): boolean {
  if (bytes.length < 12) return false

  switch (mimeType) {
    case 'image/jpeg':
      return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF
    case 'image/png':
      return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47
    case 'image/webp':
      return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
        && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
    default:
      return false
  }
}
