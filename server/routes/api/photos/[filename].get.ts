/**
 * GET /api/photos/:filename — Serves a stored photo file with
 * appropriate MIME type and immutable cache headers.
 */
import { promises as fs } from 'fs'
import { join } from 'path'

const DATA_DIR = process.env.DATA_DIR || '.data'
const PHOTOS_DIR = 'photos'

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp'
}

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'filename')

  if (!filename) {
    throw createError({
      statusCode: 400,
      message: 'Filename is required'
    })
  }

  // Validate filename to prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw createError({
      statusCode: 400,
      message: 'Invalid filename'
    })
  }

  const extension = filename.split('.').pop()?.toLowerCase()
  if (!extension || !MIME_TYPES[extension]) {
    throw createError({
      statusCode: 400,
      message: 'Invalid file type'
    })
  }

  const filePath = join(process.cwd(), DATA_DIR, PHOTOS_DIR, filename)

  try {
    const fileBuffer = await fs.readFile(filePath)

    setResponseHeader(event, 'Content-Type', MIME_TYPES[extension])
    setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

    return fileBuffer
  } catch {
    throw createError({
      statusCode: 404,
      message: 'Photo not found'
    })
  }
})
