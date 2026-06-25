import { existsSync } from 'fs'
import { join } from 'path'
import { eq, desc, and, inArray } from 'drizzle-orm'
import { entries } from '~~/server/database/schema'
import { decryptData, getTenantEncryptionKey } from '~~/server/utils/crypto'
import { getStorageDriver } from '~~/server/utils/storage-driver'
import { processBase64MediaUpload } from '~~/server/utils/upload'
import type { EntryStatus, GuestEntry, EntryMedia } from '~~/server/types/guest'

/**
 * Data directory path for photo storage.
 */
const DATA_DIR = process.env.DATA_DIR || '.data'
const PHOTOS_DIR = join(DATA_DIR, 'photos')

/**
 * Returns the photos directory path for a given guestbook.
 *
 * @param guestbookId - The guestbook ID for namespaced photo storage.
 */
function getPhotosDir(guestbookId?: string): string {
  return guestbookId ? join(PHOTOS_DIR, guestbookId) : PHOTOS_DIR
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
 * Each media item (image or video) is encrypted with the tenant's derived key
 * before saving. The first image URL is mirrored into `photoUrl` for
 * backwards compatibility (PDF export, OG sharing, analytics, legacy views).
 *
 * @param tenantId - The tenant ID for RLS context and encryption.
 * @param guestbookId - The guestbook this entry belongs to.
 * @param name - Guest name.
 * @param message - Guest message.
 * @param media - Optional list of base64 data URLs (images and/or videos), in display order.
 * @param answers - Optional form answers.
 * @param moderationEnabled - Whether the guestbook requires moderation. When true, the
 *                            entry starts as `pending`; when false, it is `approved`
 *                            immediately so it is visible to the public GET endpoint.
 * @returns The created entry.
 */
export async function createEntry(
  tenantId: string,
  guestbookId: string,
  name: string,
  message: string,
  media?: string[],
  answers?: GuestEntry['answers'],
  moderationEnabled = true
): Promise<GuestEntry> {
  const id = generateId()
  const mediaItems: EntryMedia[] = []

  // Save and encrypt each media item, preserving upload order via the index.
  const dataUrls = media ?? []
  for (let i = 0; i < dataUrls.length; i++) {
    const result = await processBase64MediaUpload(dataUrls[i], {
      directory: `photos/${guestbookId}`,
      filePrefix: `${id}-${i}`,
      urlPrefix: `/api/photos/${guestbookId}`,
      encrypt: true,
      tenantId
    })
    if (result) {
      mediaItems.push({ type: result.kind, url: result.url, mime: result.mimeType })
    }
  }

  // Mirror the first image URL into photo_url for backwards compatibility.
  const photoUrl = mediaItems.find(m => m.type === 'image')?.url
  const mediaToStore = mediaItems.length > 0 ? mediaItems : undefined

  const now = new Date()
  // Moderation-aware status: pending when moderation is on, approved otherwise.
  const status: EntryStatus = moderationEnabled ? 'pending' : 'approved'

  return withTenantContext(tenantId, async (db) => {
    await db.insert(entries).values({
      id,
      guestbookId,
      name,
      message,
      photoUrl: photoUrl || null,
      media: mediaToStore || null,
      answers: answers || null,
      status,
      createdAt: now
    })

    return {
      id,
      name,
      message,
      photoUrl,
      media: mediaToStore,
      answers,
      createdAt: now.toISOString(),
      status
    }
  })
}

/**
 * Deletes an entry by ID. Also removes the associated photo file.
 *
 * @param tenantId - The tenant ID for RLS context.
 * @param id - The entry ID to delete.
 * @param guestbookId - Optional guestbook ID to scope the entry to, preventing
 *                      cross-guestbook deletion within the same tenant.
 * @returns True if the entry was found and deleted.
 */
export async function deleteEntry(tenantId: string, id: string, guestbookId?: string): Promise<boolean> {
  return withTenantContext(tenantId, async (db) => {
    const where = guestbookId
      ? and(eq(entries.id, id), eq(entries.guestbookId, guestbookId))
      : eq(entries.id, id)
    const rows = await db.select().from(entries).where(where)
    const entry = rows[0]
    if (!entry) return false

    // Collect every stored media file URL: the new media[] plus the legacy
    // photo_url (which mirrors the first image, so de-duplicate via the Set).
    const urls = new Set<string>()
    if (entry.photoUrl) urls.add(entry.photoUrl)
    const media = entry.media as EntryMedia[] | null
    if (Array.isArray(media)) {
      for (const item of media) {
        if (item?.url) urls.add(item.url)
      }
    }

    // Delete all media files
    const driver = getStorageDriver()
    for (const url of urls) {
      const parts = url.replace('/api/photos/', '').split('/')
      const filePath = parts.length === 2
        ? join(PHOTOS_DIR, parts[0], parts[1])
        : join(PHOTOS_DIR, parts[0])
      await driver.delete(filePath)
    }

    await db.delete(entries).where(where)
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
 * @param guestbookId - Optional guestbook ID to scope the entry to, preventing
 *                      cross-guestbook moderation within the same tenant.
 * @returns The updated entry or undefined if not found.
 */
export async function updateEntryStatus(
  tenantId: string,
  id: string,
  status: EntryStatus,
  rejectionReason?: string,
  guestbookId?: string
): Promise<GuestEntry | undefined> {
  return withTenantContext(tenantId, async (db) => {
    const where = guestbookId
      ? and(eq(entries.id, id), eq(entries.guestbookId, guestbookId))
      : eq(entries.id, id)
    const rows = await db.select().from(entries).where(where)
    if (!rows[0]) return undefined

    await db.update(entries)
      .set({
        status,
        rejectionReason: status === 'rejected' ? (rejectionReason || null) : null
      })
      .where(where)

    const updated = await db.select().from(entries).where(where)
    return updated[0] ? mapRowToEntry(updated[0]) : undefined
  })
}

/**
 * Updates the status of multiple entries.
 *
 * @param tenantId - The tenant ID for RLS context.
 * @param ids - The entry IDs.
 * @param status - The new status.
 * @param guestbookId - Optional guestbook ID to scope the entries to, preventing
 *                      cross-guestbook moderation within the same tenant.
 * @returns Number of entries actually updated.
 */
export async function bulkUpdateEntryStatus(
  tenantId: string,
  ids: string[],
  status: EntryStatus,
  guestbookId?: string
): Promise<number> {
  if (ids.length === 0) return 0

  return withTenantContext(tenantId, async (db) => {
    const where = guestbookId
      ? and(inArray(entries.id, ids), eq(entries.guestbookId, guestbookId))
      : inArray(entries.id, ids)

    const result = await db.update(entries)
      .set({
        // Mirror single-update semantics: clear the rejection reason whenever the
        // entry is not rejected, instead of leaving a stale reason in place.
        status,
        rejectionReason: status === 'rejected' ? undefined : null
      })
      .where(where)

    // node-postgres exposes the affected row count via result.rowCount.
    return result.rowCount ?? 0
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
  const driver = getStorageDriver()
  const encryptedData = await driver.read(filePath)
  if (!encryptedData) return undefined

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
 * @deprecated This function only works with local filesystem storage.
 * Use the storage driver directly for cloud storage compatibility.
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
  // Synchronous check for backwards compat — local driver only
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
    case 'mp4':
      return 'video/mp4'
    case 'webm':
      return 'video/webm'
    case 'mov':
      return 'video/quicktime'
    default:
      return 'application/octet-stream'
  }
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
    media: (row.media as EntryMedia[] | null) || undefined,
    answers: row.answers as GuestEntry['answers'],
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    status: row.status as EntryStatus | undefined,
    rejectionReason: row.rejectionReason || undefined
  }
}
