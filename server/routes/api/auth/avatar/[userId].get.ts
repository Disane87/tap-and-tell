import { join } from 'path'
import { getStorageDriver } from '~~/server/utils/storage-driver'

/** MIME types by file extension. */
const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp'
}

const DATA_DIR = process.env.DATA_DIR || '.data'
const AVATAR_DIR = join(DATA_DIR, 'avatars')

/**
 * GET /api/auth/avatar/[userId]
 * Serves a user's avatar image. Public endpoint (no auth required).
 * Supports both local filesystem and cloud storage (Vercel Blob).
 *
 * @returns Binary image data with appropriate Content-Type header.
 */
export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'userId')
  if (!userId) {
    throw createError({ statusCode: 400, message: 'User ID required' })
  }

  if (userId.includes('..') || userId.includes('/') || userId.includes('\\')) {
    throw createError({ statusCode: 400, message: 'Invalid user ID' })
  }

  const driver = getStorageDriver()
  const avatarFiles = await driver.list(join(AVATAR_DIR, `${userId}.`))

  if (!avatarFiles.length) {
    throw createError({ statusCode: 404, message: 'Avatar not found' })
  }

  const avatarPath = avatarFiles[0]
  const ext = avatarPath.split('.').pop()?.toLowerCase() || ''
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream'

  const data = await driver.read(avatarPath)
  if (!data) {
    throw createError({ statusCode: 404, message: 'Avatar not found' })
  }

  setHeader(event, 'Content-Type', mimeType)
  setHeader(event, 'Cache-Control', 'public, max-age=3600, must-revalidate')

  return data
})
