import { eq } from 'drizzle-orm'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tenants, entries, guestbooks } from '~~/server/database/schema'
import { canPerformAction } from '~~/server/utils/tenant'

/**
 * POST /api/tenants/:uuid/rotate-key
 *
 * Rotates the encryption key for a tenant by generating a new salt
 * and re-encrypting all photos with the new derived key.
 *
 * Requires owner role on the tenant.
 *
 * @returns `{ success: true, data: { keyVersion, photosRotated } }`
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) {
    throw createError({ statusCode: 400, message: 'Tenant ID is required' })
  }

  // Only owners can rotate encryption keys
  if (!await canPerformAction(uuid, user.id, 'manage')) {
    throw createError({ statusCode: 403, message: 'Insufficient permissions' })
  }

  const db = useDrizzle()

  // Get current tenant info
  const tenantRows = await db.select().from(tenants).where(eq(tenants.id, uuid))
  const tenant = tenantRows[0]
  if (!tenant || !tenant.encryptionSalt) {
    throw createError({ statusCode: 404, message: 'Tenant not found or no encryption configured' })
  }

  const oldKey = deriveTenantKey(tenant.encryptionSalt)
  const newSalt = generateEncryptionSalt()
  const newKey = deriveTenantKey(newSalt)
  const newVersion = String(parseInt(tenant.keyVersion || '1', 10) + 1)

  // Get all entries with photos for this tenant (RLS-scoped)
  const allEntries = await withTenantContext(uuid, async (txDb) => {
    const entryRows = await txDb.select({
      id: entries.id,
      guestbookId: entries.guestbookId,
      photoUrl: entries.photoUrl
    }).from(entries)

    return entryRows.filter(e => e.photoUrl)
  })

  const DATA_DIR = process.env.DATA_DIR || '.data'
  const PHOTOS_DIR = join(DATA_DIR, 'photos')
  let rotatedCount = 0

  // Re-encrypt each photo with the new key
  for (const entry of allEntries) {
    if (!entry.photoUrl) continue

    // Parse the photo path from the URL
    const parts = entry.photoUrl.replace('/api/photos/', '').split('/')
    let filePath: string
    if (parts.length >= 2) {
      filePath = join(PHOTOS_DIR, parts[0], parts[1])
    } else {
      filePath = join(PHOTOS_DIR, parts[0])
    }

    if (!existsSync(filePath)) continue

    try {
      const encryptedData = readFileSync(filePath)
      const plainData = decryptData(encryptedData, oldKey)
      const reEncrypted = encryptData(plainData, newKey)
      writeFileSync(filePath, reEncrypted)
      rotatedCount++
    } catch (error) {
      console.error(`[key-rotation] Failed to re-encrypt photo for entry ${entry.id}:`, error)
    }
  }

  // Update tenant with new salt and version
  await db.update(tenants).set({
    encryptionSalt: newSalt,
    keyVersion: newVersion,
    updatedAt: new Date()
  }).where(eq(tenants.id, uuid))

  await recordAuditLog(event, 'key.rotate', {
    tenantId: uuid,
    userId: user.id,
    resourceType: 'tenant',
    resourceId: uuid,
    details: { oldVersion: tenant.keyVersion, newVersion, photosRotated: rotatedCount }
  })

  return {
    success: true,
    data: {
      keyVersion: newVersion,
      photosRotated: rotatedCount
    }
  }
})
