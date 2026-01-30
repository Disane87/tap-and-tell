import { readFileSync } from 'fs'

/**
 * GET /api/photos/:filename
 * Serves photo files with appropriate MIME type and cache headers.
 */
export default defineEventHandler((event) => {
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

  const filePath = getPhotoPath(filename)

  if (!filePath) {
    throw createError({
      statusCode: 404,
      message: 'Photo not found'
    })
  }

  const mimeType = getPhotoMimeType(filename)
  const fileContent = readFileSync(filePath)

  // Set cache headers (1 year for immutable content)
  setHeaders(event, {
    'Content-Type': mimeType,
    'Cache-Control': 'public, max-age=31536000, immutable'
  })

  return fileContent
})
