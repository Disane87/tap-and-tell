import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { eq, desc, and, inArray } from 'drizzle-orm'
import { entries, tenants } from '~~/server/database/schema'
import { encryptData, decryptData, deriveTenantKey } from '~~/server/utils/crypto'
import type { EntryStatus, GuestEntry } from '~~/server/types/guest'

/**
 * Data directory path for photo storage.
 */
const DATA_DIR = process.env.DATA_DIR || '.data'
const PHOTOS_DIR = join(DATA_DIR, 'photos')

/**
 * Ensures the photos directory exists for a given guestbook.
 *
 * @param guestbookId - The guestbook ID for namespaced photo storage.
 */
function ensurePhotosDir(guestbookId?: string): string {
  const dir = guestbookId ? join(PHOTOS_DIR, guestbookId) : PHOTOS_DIR
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

/**
 * Reads all guest entries from the database for a given guestbook.
 * Requires tenant context to be set for RLS.
 *
 * @param tenantId - The tenant ID for RLS context.
 * @param guestbookId - The guestbook ID to scope entries to.
 * @returns Array of guest entries sorted newest first.
 */
export async function readEntries(tenantId: string, guestbookId?: string): Promise<GuestEntry[]> {
  return withTenantContext(tenantId, async (db) => {
    const conditions = guestbookId ? eq(entries.guestbookId, guestbookId) : undefined
    const rows = await db.select().from(entries).where(conditions).orderBy(desc(entries.createdAt))
    return rows.map(mapRowToEntry)
  })
}

/**
 * Reads only approved guest entries for a guestbook.
 *
 * @param tenantId - The tenant ID for RLS context.
 * @param guestbookId - The guestbook ID to scope entries to.
 * @returns Array of approved guest entries.
 */
export async function readApprovedEntries(tenantId: string, guestbookId?: string): Promise<GuestEntry[]> {
  return withTenantContext(tenantId, async (db) => {
    const conditions = guestbookId
      ? and(eq(entries.guestbookId, guestbookId), eq(entries.status, 'approved'))
      : eq(entries.status, 'approved')
    const rows = await db.select().from(entries).where(conditions).orderBy(desc(entries.createdAt))
    return rows.map(mapRowToEntry)
  })
}

/**
 * Reads entries filtered by status for a guestbook.
 *
 * @param tenantId - The tenant ID for RLS context.
 * @param status - The status to filter by.
 * @param guestbookId - The guestbook ID to scope entries to.
 * @returns Filtered entries.
 */
export async function readEntriesByStatus(tenantId: string, status: EntryStatus, guestbookId?: string): Promise<GuestEntry[]> {
  return withTenantContext(tenantId, async (db) => {
    const conditions = guestbookId
      ? and(eq(entries.guestbookId, guestbookId), eq(entries.status, status))
      : eq(entries.status, status)
    const rows = await db.select().from(entries).where(conditions).orderBy(desc(entries.createdAt))
    return rows.map(mapRowToEntry)
  })
}

/**
 * Finds a single entry by ID within a tenant context.
 *
 * @param tenantId - The tenant ID for RLS context.
 * @param id - The entry ID.
 * @returns The entry or undefined if not found.
 */
export async function findEntryById(tenantId: string, id: string): Promise<GuestEntry | undefined> {
  return withTenantContext(tenantId, async (db) => {
    const rows = await db.select().from(entries).where(eq(entries.id, id))
    const row = rows[0]
    return row ? mapRowToEntry(row) : undefined
  })
}

/**
 * Creates a new guest entry with a generated ID.
 * Photos are encrypted with the tenant's derived key before saving.
 *
 * @param tenantId - The tenant ID for RLS context and encryption.
 * @param guestbookId - The guestbook this entry belongs to.
 * @param name - Guest name.
 * @param message - Guest message.
 * @param photo - Optional base64-encoded photo data.
 * @param answers - Optional form answers.
 * @returns The created entry.
 */
export async function createEntry(
  tenantId: string,
  guestbookId: string,
  name: string,
  message: string,
  photo?: string,
  answers?: GuestEntry['answers']
): Promise<GuestEntry> {
  const id = generateId()
  let photoUrl: string | undefined

  // Save and encrypt photo if provided
  if (photo) {
    const match = photo.match(/^data:image\/(\w+);base64,(.+)$/)
    if (match) {
      const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
      const base64Data = match[2]
      const filename = `${id}.${ext}.enc`
      const photosDir = ensurePhotosDir(guestbookId)
      const filePath = join(photosDir, filename)

      const plainData = Buffer.from(base64Data, 'base64')
      const tenantKey = await getTenantEncryptionKey(tenantId)
      const encryptedData = encryptData(plainData, tenantKey)

      writeFileSync(filePath, encryptedData)
      photoUrl = `/api/photos/${guestbookId}/${filename}`
    }
  }

  const now = new Date()

  return withTenantContext(tenantId, async (db) => {
    await db.insert(entries).values({
      id,
      guestbookId,
      name,
      message,
      photoUrl: photoUrl || null,
      answers: answers || null,
      status: 'pending',
      createdAt: now
    })

    return {
      id,
      name,
      message,
      photoUrl,
      answers,
      createdAt: now.toISOString(),
      status: 'pending'
    }
  })
}

/**
 * Deletes an entry by ID. Also removes the associated photo file.
 *
 * @param tenantId - The tenant ID for RLS context.
 * @param id - The entry ID to delete.
 * @returns True if the entry was found and deleted.
 */
export async function deleteEntry(tenantId: string, id: string): Promise<boolean> {
  return withTenantContext(tenantId, async (db) => {
    const rows = await db.select().from(entries).where(eq(entries.id, id))
    const entry = rows[0]
    if (!entry) return false

    // Delete photo file if exists
    if (entry.photoUrl) {
      const parts = entry.photoUrl.replace('/api/photos/', '').split('/')
      let filePath: string
      if (parts.length === 2) {
        filePath = join(PHOTOS_DIR, parts[0], parts[1])
      } else {
        filePath = join(PHOTOS_DIR, parts[0])
      }
      if (existsSync(filePath)) {
        unlinkSync(filePath)
      }
    }

    await db.delete(entries).where(eq(entries.id, id))
    return true
  })
}

/**
 * Updates the moderation status of an entry.
 *
 * @param tenantId - The tenant ID for RLS context.
 * @param id - The entry ID.
 * @param status - The new status.
 * @param rejectionReason - Optional reason for rejection.
 * @returns The updated entry or undefined if not found.
 */
export async function updateEntryStatus(
  tenantId: string,
  id: string,
  status: EntryStatus,
  rejectionReason?: string
): Promise<GuestEntry | undefined> {
  return withTenantContext(tenantId, async (db) => {
    const rows = await db.select().from(entries).where(eq(entries.id, id))
    if (!rows[0]) return undefined

    await db.update(entries)
      .set({
        status,
        rejectionReason: status === 'rejected' ? (rejectionReason || null) : null
      })
      .where(eq(entries.id, id))

    const updated = await db.select().from(entries).where(eq(entries.id, id))
    return updated[0] ? mapRowToEntry(updated[0]) : undefined
  })
}

/**
 * Updates the status of multiple entries.
 *
 * @param tenantId - The tenant ID for RLS context.
 * @param ids - The entry IDs.
 * @param status - The new status.
 * @returns Number of entries updated.
 */
export async function bulkUpdateEntryStatus(tenantId: string, ids: string[], status: EntryStatus): Promise<number> {
  if (ids.length === 0) return 0

  return withTenantContext(tenantId, async (db) => {
    const result = await db.update(entries)
      .set({
        status,
        rejectionReason: status !== 'rejected' ? null : undefined
      })
      .where(inArray(entries.id, ids))

    // node-postgres doesn't return rowCount directly from drizzle,
    // but the update completes successfully
    return ids.length
  })
}

/**
 * Reads and decrypts a photo file for a tenant.
 *
 * @param tenantId - The tenant ID for key derivation.
 * @param guestbookId - The guestbook ID.
 * @param filename - The photo filename (with .enc extension).
 * @returns The decrypted photo data or undefined if not found.
 */
export async function readEncryptedPhoto(
  tenantId: string,
  guestbookId: string,
  filename: string
): Promise<Buffer | undefined> {
  const filePath = join(PHOTOS_DIR, guestbookId, filename)
  if (!existsSync(filePath)) return undefined

  const encryptedData = readFileSync(filePath)

  // If file is not encrypted (legacy), return as-is
  if (!filename.endsWith('.enc')) {
    return encryptedData
  }

  const tenantKey = await getTenantEncryptionKey(tenantId)
  return decryptData(encryptedData, tenantKey)
}

/**
 * Gets the file path for a photo by filename.
 * Supports both legacy paths and guestbook-namespaced paths.
 *
 * @param args - Filename or guestbook ID + filename.
 * @returns The file path or undefined if not found.
 */
export function getPhotoPath(...args: string[]): string | undefined {
  let filePath: string
  if (args.length === 2) {
    filePath = join(PHOTOS_DIR, args[0], args[1])
  } else {
    filePath = join(PHOTOS_DIR, args[0])
  }
  if (existsSync(filePath)) {
    return filePath
  }
  return undefined
}

/**
 * Gets the MIME type for a photo based on extension.
 *
 * @param filename - The photo filename.
 * @returns The MIME type string.
 */
export function getPhotoMimeType(filename: string): string {
  // Strip .enc extension if present
  const cleanName = filename.replace(/\.enc$/, '')
  const ext = cleanName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    default:
      return 'application/octet-stream'
  }
}

/**
 * Retrieves the tenant's encryption key by looking up their salt from the DB.
 * Uses the non-RLS db since we need tenant data regardless of context.
 *
 * @param tenantId - The tenant ID.
 * @returns The derived 32-byte tenant encryption key.
 */
async function getTenantEncryptionKey(tenantId: string): Promise<Buffer> {
  const db = useDrizzle()
  const rows = await db.select({ encryptionSalt: tenants.encryptionSalt })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
  const tenant = rows[0]

  if (!tenant?.encryptionSalt) {
    throw new Error(`Tenant ${tenantId} has no encryption salt configured`)
  }

  return deriveTenantKey(tenant.encryptionSalt)
}

/**
 * Maps a database row to a GuestEntry interface.
 *
 * @param row - The database row.
 * @returns A GuestEntry object.
 */
function mapRowToEntry(row: typeof entries.$inferSelect): GuestEntry {
  return {
    id: row.id,
    name: row.name,
    message: row.message,
    photoUrl: row.photoUrl || undefined,
    answers: row.answers as GuestEntry['answers'],
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    status: row.status as EntryStatus | undefined,
    rejectionReason: row.rejectionReason || undefined
  }
}
