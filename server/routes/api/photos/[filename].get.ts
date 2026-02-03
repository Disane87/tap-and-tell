import { join } from 'path'
import { getPhotoMimeType } from '~~/server/utils/storage'
import { getStorageDriver } from '~~/server/utils/storage-driver'

const DATA_DIR = process.env.DATA_DIR || '.data'
const PHOTOS_DIR = join(DATA_DIR, 'photos')

/**
 * GET /api/photos/:filename
 * Serves legacy photo files (without guestbook namespace) with appropriate MIME type and cache headers.
 * Supports both local filesystem and cloud storage (Vercel Blob).
 */
export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'filename')

  if (!filename) {
    throw createError({
      statusCode: 400,
      message: 'Filename is required'
    })
  }

  // Prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw createError({
      statusCode: 400,
      message: 'Invalid filename'
    })
  }

  const filePath = join(PHOTOS_DIR, filename)
  const driver = getStorageDriver()
  const fileContent = await driver.read(filePath)

  if (!fileContent) {
    throw createError({
      statusCode: 404,
      message: 'Photo not found'
    })
  }

  const mimeType = getPhotoMimeType(filename)

  // Set cache headers (1 year for immutable content)
  setHeaders(event, {
    'Content-Type': mimeType,
    'Cache-Control': 'public, max-age=31536000, immutable'
  })

  return fileContent
})
