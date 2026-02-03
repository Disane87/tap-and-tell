/**
 * POST /api/tenants/:uuid/guestbooks/:gbUuid/header
 * Uploads a header image for a guestbook.
 * Accepts multipart/form-data with an image file.
 * Encrypts and stores the image, updates guestbook settings.
 *
 * Size limit configurable via IMAGE_MAX_BACKGROUND_SIZE env variable.
 */
import { existsSync, mkdirSync, writeFileSync, unlinkSync, readdirSync } from 'fs'
import { join } from 'path'
import { encryptData, deriveTenantKey } from '~~/server/utils/crypto'
import { validatePhotoMimeType } from '~~/server/utils/sanitize'
import { MAX_BACKGROUND_SIZE, formatSize } from '~~/server/utils/image-config'

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

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No file uploaded' })
  }

  const filePart = formData.find(part => part.name === 'file')
  if (!filePart || !filePart.data || !filePart.filename) {
    throw createError({ statusCode: 400, message: 'No image file provided' })
  }

  if (filePart.data.length > MAX_BACKGROUND_SIZE) {
    throw createError({ statusCode: 400, message: `File too large (max ${formatSize(MAX_BACKGROUND_SIZE)})` })
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

  // Ensure directory exists
  const photosDir = join(PHOTOS_DIR, gbUuid)
  if (!existsSync(photosDir)) {
    mkdirSync(photosDir, { recursive: true })
  }

  // Delete any existing header files
  if (existsSync(photosDir)) {
    const files = readdirSync(photosDir)
    for (const file of files) {
      if (file.startsWith('header.')) {
        unlinkSync(join(photosDir, file))
      }
    }
  }

  // Encrypt and save
  const tenantKey = await getTenantEncryptionKey(uuid)
  const encryptedData = encryptData(Buffer.from(filePart.data), tenantKey)
  writeFileSync(join(photosDir, filename), encryptedData)

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
