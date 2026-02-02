import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync, readdirSync } from 'fs'

/** MIME types by file extension. */
const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp'
}

/**
 * GET /api/auth/avatar/[userId]
 * Serves a user's avatar image. Public endpoint (no auth required).
 *
 * @returns Binary image data with appropriate Content-Type header.
 */
export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'userId')
  if (!userId) {
    throw createError({ statusCode: 400, message: 'User ID required' })
  }

  const dataDir = process.env.DATA_DIR || '.data'
  const avatarDir = join(dataDir, 'avatars')

  if (!existsSync(avatarDir)) {
    throw createError({ statusCode: 404, message: 'Avatar not found' })
  }

  // Find the avatar file for this user (any extension)
  const files = readdirSync(avatarDir)
  const avatarFile = files.find(f => f.startsWith(`${userId}.`))
  if (!avatarFile) {
    throw createError({ statusCode: 404, message: 'Avatar not found' })
  }

  const ext = avatarFile.split('.').pop()?.toLowerCase() || ''
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream'
  const filepath = join(avatarDir, avatarFile)
  const data = await readFile(filepath)

  setHeader(event, 'Content-Type', mimeType)
  setHeader(event, 'Cache-Control', 'public, max-age=3600, must-revalidate')

  return data
})
