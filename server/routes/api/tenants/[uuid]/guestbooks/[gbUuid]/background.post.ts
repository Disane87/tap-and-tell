/**
 * POST /api/tenants/:uuid/guestbooks/:gbUuid/background
 * Uploads a background image for a guestbook.
 * Accepts multipart/form-data with an image file (max 5MB).
 * Encrypts and stores the image, updates guestbook settings.
 */
import { processUpload } from '~~/server/utils/upload'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }
  requireScope(event, 'guestbooks:write')

  const uuid = getRouterParam(event, 'uuid')
  const gbUuid = getRouterParam(event, 'gbUuid')
  if (!uuid || !gbUuid) {
    throw createError({ statusCode: 400, message: 'Tenant ID and Guestbook ID are required' })
  }

  if (!await canPerformAction(uuid, user.id, 'manage')) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const existing = await getGuestbookById(gbUuid)
  if (!existing || existing.tenantId !== uuid) {
    throw createError({ statusCode: 404, message: 'Guestbook not found' })
  }

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No file uploaded' })
  }

  const filePart = formData.find(part => part.name === 'file')
  if (!filePart || !filePart.data || !filePart.filename) {
    throw createError({ statusCode: 400, message: 'No image file provided' })
  }

  try {
    const result = await processUpload(Buffer.from(filePart.data), {
      directory: `photos/${gbUuid}`,
      filePrefix: 'bg',
      urlPrefix: `/api/photos/${gbUuid}`,
      encrypt: true,
      tenantId: uuid,
      deleteExisting: true
    })

    // Update guestbook settings with cache-busting timestamp
    const cacheBustedUrl = `${result.url}?v=${Date.now()}`
    const settings = { ...(existing.settings || {}), backgroundImageUrl: cacheBustedUrl }
    const updated = await updateGuestbook(gbUuid, { settings })

    await recordAuditLog(event, 'guestbook.background.upload', {
      tenantId: uuid,
      resourceType: 'guestbook',
      resourceId: gbUuid
    })

    return {
      success: true,
      data: updated
    }
  } catch (error) {
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Upload failed'
    })
  }
})
