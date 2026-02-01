import { readFileSync } from 'fs'
import { readEncryptedPhoto, getPhotoPath, getPhotoMimeType } from '~~/server/utils/storage'
import { getGuestbookById } from '~~/server/utils/guestbook'

/**
 * GET /api/photos/:tenantId/:filename
 * Serves guestbook-namespaced photo files with appropriate MIME type and cache headers.
 * The tenantId param is actually the guestbookId (see storage.ts photoUrl format).
 * For encrypted files (.enc), decrypts using the tenant's encryption key.
 */
export default defineEventHandler(async (event) => {
  const guestbookId = getRouterParam(event, 'tenantId')
  const filename = getRouterParam(event, 'filename')

  if (!guestbookId || !filename) {
    throw createError({ statusCode: 400, message: 'Guestbook ID and filename are required' })
  }

  if (guestbookId.includes('..') || guestbookId.includes('/') || guestbookId.includes('\\')) {
    throw createError({ statusCode: 400, message: 'Invalid ID' })
  }
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw createError({ statusCode: 400, message: 'Invalid filename' })
  }

  const mimeType = getPhotoMimeType(filename)

  if (filename.endsWith('.enc')) {
    const guestbook = await getGuestbookById(guestbookId)
    if (!guestbook) {
      throw createError({ statusCode: 404, message: 'Photo not found' })
    }
    const decrypted = await readEncryptedPhoto(guestbook.tenantId, guestbookId, filename)
    if (!decrypted) {
      throw createError({ statusCode: 404, message: 'Photo not found' })
    }
    setHeaders(event, {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable'
    })
    return decrypted
  }

  const filePath = getPhotoPath(guestbookId, filename)
  if (!filePath) {
    throw createError({ statusCode: 404, message: 'Photo not found' })
  }
  const fileContent = readFileSync(filePath)
  setHeaders(event, {
    'Content-Type': mimeType,
    'Cache-Control': 'public, max-age=31536000, immutable'
  })
  return fileContent
})
