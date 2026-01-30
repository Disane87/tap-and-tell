import { randomUUID } from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import type { GuestEntry } from '~~/server/types/guest'

/**
 * Data directory path. Configurable via DATA_DIR env var.
 */
const DATA_DIR = process.env.DATA_DIR || '.data'
const ENTRIES_FILE = join(DATA_DIR, 'entries.json')
const PHOTOS_DIR = join(DATA_DIR, 'photos')

/**
 * Ensures the data directory and photos subdirectory exist.
 */
function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!existsSync(PHOTOS_DIR)) {
    mkdirSync(PHOTOS_DIR, { recursive: true })
  }
}

/**
 * Reads all guest entries from the JSON file.
 * Returns empty array if file doesn't exist.
 */
export function readEntries(): GuestEntry[] {
  ensureDataDir()
  if (!existsSync(ENTRIES_FILE)) {
    return []
  }
  try {
    const data = readFileSync(ENTRIES_FILE, 'utf-8')
    return JSON.parse(data) as GuestEntry[]
  } catch {
    return []
  }
}

/**
 * Writes all guest entries to the JSON file.
 */
export function writeEntries(entries: GuestEntry[]): void {
  ensureDataDir()
  writeFileSync(ENTRIES_FILE, JSON.stringify(entries, null, 2), 'utf-8')
}

/**
 * Finds a single entry by ID.
 */
export function findEntryById(id: string): GuestEntry | undefined {
  const entries = readEntries()
  return entries.find(e => e.id === id)
}

/**
 * Creates a new guest entry with a generated UUID.
 * Optionally saves a photo file and sets the photoUrl.
 */
export function createEntry(
  name: string,
  message: string,
  photo?: string,
  answers?: GuestEntry['answers']
): GuestEntry {
  ensureDataDir()
  const id = randomUUID()
  let photoUrl: string | undefined

  // Save photo if provided (base64 data)
  if (photo) {
    const match = photo.match(/^data:image\/(\w+);base64,(.+)$/)
    if (match) {
      const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
      const base64Data = match[2]
      const filename = `${id}.${ext}`
      const filePath = join(PHOTOS_DIR, filename)
      writeFileSync(filePath, Buffer.from(base64Data, 'base64'))
      photoUrl = `/api/photos/${filename}`
    }
  }

  const entry: GuestEntry = {
    id,
    name,
    message,
    photoUrl,
    answers,
    createdAt: new Date().toISOString()
  }

  const entries = readEntries()
  entries.unshift(entry) // Newest first
  writeEntries(entries)

  return entry
}

/**
 * Deletes an entry by ID. Also removes the associated photo file.
 * Returns true if the entry was found and deleted.
 */
export function deleteEntry(id: string): boolean {
  const entries = readEntries()
  const index = entries.findIndex(e => e.id === id)
  if (index === -1) return false

  const entry = entries[index]

  // Delete photo file if exists
  if (entry.photoUrl) {
    const filename = entry.photoUrl.split('/').pop()
    if (filename) {
      const filePath = join(PHOTOS_DIR, filename)
      if (existsSync(filePath)) {
        unlinkSync(filePath)
      }
    }
  }

  entries.splice(index, 1)
  writeEntries(entries)
  return true
}

/**
 * Gets the file path for a photo by filename.
 * Returns undefined if file doesn't exist.
 */
export function getPhotoPath(filename: string): string | undefined {
  const filePath = join(PHOTOS_DIR, filename)
  if (existsSync(filePath)) {
    return filePath
  }
  return undefined
}

/**
 * Gets the MIME type for a photo based on extension.
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
