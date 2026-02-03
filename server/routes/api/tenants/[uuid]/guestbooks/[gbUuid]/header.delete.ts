/**
 * DELETE /api/tenants/:uuid/guestbooks/:gbUuid/header
 * Removes the header image for a guestbook.
 * Deletes the file from disk and clears headerImageUrl from settings.
 */
import { existsSync, unlinkSync, readdirSync } from 'fs'
import { join } from 'path'

const DATA_DIR = process.env.DATA_DIR || '.data'
const PHOTOS_DIR = join(DATA_DIR, 'photos')

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

  // Delete all header.* files from disk
  const photosDir = join(PHOTOS_DIR, gbUuid)
  if (existsSync(photosDir)) {
    const files = readdirSync(photosDir)
    for (const file of files) {
      if (file.startsWith('header.')) {
        unlinkSync(join(photosDir, file))
      }
    }
  }

  // Clear headerImageUrl from settings
  const settings = { ...(existing.settings || {}) }
  delete settings.headerImageUrl
  const updated = await updateGuestbook(gbUuid, { settings })

  await recordAuditLog(event, 'guestbook.header.delete', {
    tenantId: uuid,
    resourceType: 'guestbook',
    resourceId: gbUuid
  })

  return {
    success: true,
    data: updated
  }
})
