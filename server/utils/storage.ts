import { randomUUID } from 'crypto'
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { eq, desc, and, inArray } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { entries } from '~~/server/database/schema'
import type { EntryStatus, GuestEntry } from '~~/server/types/guest'

/**
 * Data directory path for photo storage.
 */
const DATA_DIR = process.env.DATA_DIR || '.data'
const PHOTOS_DIR = join(DATA_DIR, 'photos')

/**
 * Ensures the photos directory exists for a given tenant.
 *
 * @param tenantId - The tenant ID for namespaced photo storage.
 */
function ensurePhotosDir(tenantId?: string): string {
  const dir = tenantId ? join(PHOTOS_DIR, tenantId) : PHOTOS_DIR
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

/**
 * Reads all guest entries from the database for a given tenant.
 * Returns newest first.
 *
 * @param tenantId - The tenant ID to scope entries to.
 * @returns Array of guest entries sorted newest first.
 */
export function readEntries(tenantId?: string): GuestEntry[] {
  const db = useDb()
  const conditions = tenantId ? eq(entries.tenantId, tenantId) : undefined
  const rows = db.select().from(entries).where(conditions).orderBy(desc(entries.createdAt)).all()
  return rows.map(mapRowToEntry)
}

/**
 * Reads only approved guest entries for a tenant.
 * Entries without a status are treated as approved for backward compatibility.
 *
 * @param tenantId - The tenant ID to scope entries to.
 * @returns Array of approved guest entries.
 */
export function readApprovedEntries(tenantId?: string): GuestEntry[] {
  const db = useDb()
  const conditions = tenantId
    ? and(eq(entries.tenantId, tenantId), eq(entries.status, 'approved'))
    : eq(entries.status, 'approved')
  const rows = db.select().from(entries).where(conditions).orderBy(desc(entries.createdAt)).all()
  return rows.map(mapRowToEntry)
}

/**
 * Reads entries filtered by status for a tenant.
 *
 * @param status - The status to filter by.
 * @param tenantId - The tenant ID to scope entries to.
 * @returns Filtered entries.
 */
export function readEntriesByStatus(status: EntryStatus, tenantId?: string): GuestEntry[] {
  const db = useDb()
  const conditions = tenantId
    ? and(eq(entries.tenantId, tenantId), eq(entries.status, status))
    : eq(entries.status, status)
  const rows = db.select().from(entries).where(conditions).orderBy(desc(entries.createdAt)).all()
  return rows.map(mapRowToEntry)
}

/**
 * Finds a single entry by ID.
 *
 * @param id - The entry ID.
 * @returns The entry or undefined if not found.
 */
export function findEntryById(id: string): GuestEntry | undefined {
  const db = useDb()
  const row = db.select().from(entries).where(eq(entries.id, id)).get()
  return row ? mapRowToEntry(row) : undefined
}

/**
 * Creates a new guest entry with a generated UUID.
 * Optionally saves a photo file and sets the photoUrl.
 *
 * @param tenantId - The tenant this entry belongs to.
 * @param name - Guest name.
 * @param message - Guest message.
 * @param photo - Optional base64-encoded photo data.
 * @param answers - Optional form answers.
 * @returns The created entry.
 */
export function createEntry(
  tenantId: string,
  name: string,
  message: string,
  photo?: string,
  answers?: GuestEntry['answers']
): GuestEntry {
  const db = useDb()
  const id = randomUUID()
  let photoUrl: string | undefined

  // Save photo if provided (base64 data)
  if (photo) {
    const match = photo.match(/^data:image\/(\w+);base64,(.+)$/)
    if (match) {
      const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
      const base64Data = match[2]
      const filename = `${id}.${ext}`
      const photosDir = ensurePhotosDir(tenantId)
      const filePath = join(photosDir, filename)
      writeFileSync(filePath, Buffer.from(base64Data, 'base64'))
      photoUrl = `/api/photos/${tenantId}/${filename}`
    }
  }

  const now = new Date().toISOString()

  db.insert(entries).values({
    id,
    tenantId,
    name,
    message,
    photoUrl: photoUrl || null,
    answers: answers || null,
    status: 'pending',
    createdAt: now
  }).run()

  return {
    id,
    name,
    message,
    photoUrl,
    answers,
    createdAt: now,
    status: 'pending'
  }
}

/**
 * Deletes an entry by ID. Also removes the associated photo file.
 *
 * @param id - The entry ID to delete.
 * @returns True if the entry was found and deleted.
 */
export function deleteEntry(id: string): boolean {
  const db = useDb()
  const entry = db.select().from(entries).where(eq(entries.id, id)).get()
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

  db.delete(entries).where(eq(entries.id, id)).run()
  return true
}

/**
 * Updates the moderation status of an entry.
 *
 * @param id - The entry ID.
 * @param status - The new status.
 * @param rejectionReason - Optional reason for rejection.
 * @returns The updated entry or undefined if not found.
 */
export function updateEntryStatus(
  id: string,
  status: EntryStatus,
  rejectionReason?: string
): GuestEntry | undefined {
  const db = useDb()
  const existing = db.select().from(entries).where(eq(entries.id, id)).get()
  if (!existing) return undefined

  db.update(entries)
    .set({
      status,
      rejectionReason: status === 'rejected' ? (rejectionReason || null) : null
    })
    .where(eq(entries.id, id))
    .run()

  const updated = db.select().from(entries).where(eq(entries.id, id)).get()
  return updated ? mapRowToEntry(updated) : undefined
}

/**
 * Updates the status of multiple entries.
 *
 * @param ids - The entry IDs.
 * @param status - The new status.
 * @returns Number of entries updated.
 */
export function bulkUpdateEntryStatus(ids: string[], status: EntryStatus): number {
  if (ids.length === 0) return 0
  const db = useDb()

  const result = db.update(entries)
    .set({
      status,
      rejectionReason: status !== 'rejected' ? null : undefined
    })
    .where(inArray(entries.id, ids))
    .run()

  return result.changes
}

/**
 * Gets the file path for a photo by filename.
 * Supports both legacy paths and tenant-namespaced paths.
 *
 * @param args - Filename or tenant ID + filename.
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
  const ext = filename.split('.').pop()?.toLowerCase()
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
    createdAt: row.createdAt,
    status: row.status as EntryStatus | undefined,
    rejectionReason: row.rejectionReason || undefined
  }
}
