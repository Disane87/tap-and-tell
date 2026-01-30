import { readFileSync } from 'fs'

/**
 * GET /api/photos/:tenantId/:filename
 * Serves tenant-namespaced photo files with appropriate MIME type and cache headers.
 */
export default defineEventHandler((event) => {
  const tenantId = getRouterParam(event, 'tenantId')
  const filename = getRouterParam(event, 'filename')

  if (!tenantId || !filename) {
    throw createError({
      statusCode: 400,
      message: 'Tenant ID and filename are required'
    })
  }

  // Prevent directory traversal
  if (tenantId.includes('..') || tenantId.includes('/') || tenantId.includes('\\')) {
    throw createError({
      statusCode: 400,
      message: 'Invalid tenant ID'
    })
  }

  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw createError({
      statusCode: 400,
      message: 'Invalid filename'
    })
  }

  const filePath = getPhotoPath(tenantId, filename)

  if (!filePath) {
    throw createError({
      statusCode: 404,
      message: 'Photo not found'
    })
  }

  const mimeType = getPhotoMimeType(filename)
  const fileContent = readFileSync(filePath)

  setHeaders(event, {
    'Content-Type': mimeType,
    'Cache-Control': 'public, max-age=31536000, immutable'
  })

  return fileContent
})
