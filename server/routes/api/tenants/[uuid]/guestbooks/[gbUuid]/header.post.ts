/**
 * POST /api/tenants/:uuid/guestbooks/:gbUuid/header
 * Uploads a header image for a guestbook.
 * Accepts multipart/form-data with an image file (max 5MB).
 * Encrypts and stores the image, updates guestbook settings.
 */
import { join } from 'path'
import { encryptData, deriveTenantKey } from '~~/server/utils/crypto'
import { validatePhotoMimeType } from '~~/server/utils/sanitize'
import { getStorageDriver } from '~~/server/utils/storage-driver'

const DATA_DIR = process.env.DATA_DIR || '.data'
const PHOTOS_DIR = join(DATA_DIR, 'photos')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

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

  if (filePart.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 400, message: 'File too large (max 5MB)' })
  }

  // Validate image magic bytes
  const base64 = Buffer.from(filePart.data).toString('base64')
  const validation = validatePhotoMimeType(base64)
  if (!validation.valid) {
    throw createError({ statusCode: 400, message: 'Invalid image format. Supported: JPEG, PNG, WebP, HEIC' })
  }

  // Determine file extension from detected MIME type
  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic'
  }
  const ext = extMap[validation.mimeType!] || 'jpg'
  const filename = `header.${ext}.enc`

  const driver = getStorageDriver()
  const photosDir = join(PHOTOS_DIR, gbUuid)

  // Delete any existing header files
  const existingFiles = await driver.list(join(photosDir, 'header.'))
  for (const file of existingFiles) {
    await driver.delete(file)
  }

  // Encrypt and save using storage driver
  const tenantKey = await getTenantEncryptionKey(uuid)
  const encryptedData = encryptData(Buffer.from(filePart.data), tenantKey)
  await driver.write(join(photosDir, filename), encryptedData)

  // Update guestbook settings
  const headerImageUrl = `/api/photos/${gbUuid}/${filename}`
  const settings = { ...(existing.settings || {}), headerImageUrl }
  const updated = await updateGuestbook(gbUuid, { settings })

  await recordAuditLog(event, 'guestbook.header.upload', {
    tenantId: uuid,
    resourceType: 'guestbook',
    resourceId: gbUuid
  })

  return {
    success: true,
    data: updated
  }
})

/**
 * Retrieves the tenant's encryption key by looking up their salt from the DB.
 */
async function getTenantEncryptionKey(tenantId: string): Promise<Buffer> {
  const db = useDrizzle()
  const { tenants } = await import('~~/server/database/schema')
  const { eq } = await import('drizzle-orm')
  const rows = await db.select({ encryptionSalt: tenants.encryptionSalt })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
  const tenant = rows[0]

  if (!tenant?.encryptionSalt) {
    throw new Error(`Tenant ${tenantId} has no encryption salt configured`)
  }

  return deriveTenantKey(tenant.encryptionSalt)
}
