/**
 * Server-side file storage utilities for guest entries and photos.
 *
 * Entries are stored as JSON in `.data/entries.json`.
 * Photos are stored as files in `.data/photos/`.
 * @module server/utils/storage
 */
import { promises as fs } from 'fs'
import { join } from 'path'
import type { GuestEntry } from '../../app/types/guest'

const DATA_DIR = process.env.DATA_DIR || '.data'
const ENTRIES_FILE = 'entries.json'
const PHOTOS_DIR = 'photos'

/** Ensures the data and photos directories exist, creating them if necessary. */
async function ensureDataDir(): Promise<void> {
  const dataPath = join(process.cwd(), DATA_DIR)
  const photosPath = join(dataPath, PHOTOS_DIR)

  try {
    await fs.access(dataPath)
  } catch {
    await fs.mkdir(dataPath, { recursive: true })
  }

  try {
    await fs.access(photosPath)
  } catch {
    await fs.mkdir(photosPath, { recursive: true })
  }
}

/** Returns the absolute path to the entries JSON file. */
async function getEntriesFilePath(): Promise<string> {
  await ensureDataDir()
  return join(process.cwd(), DATA_DIR, ENTRIES_FILE)
}

/** Reads all guest entries from the JSON file. Returns `[]` if the file doesn't exist. */
export async function getEntries(): Promise<GuestEntry[]> {
  const filePath = await getEntriesFilePath()

  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data) as GuestEntry[]
  } catch {
    return []
  }
}

/** Overwrites the entries JSON file with the given array. */
export async function saveEntries(entries: GuestEntry[]): Promise<void> {
  const filePath = await getEntriesFilePath()
  await fs.writeFile(filePath, JSON.stringify(entries, null, 2), 'utf-8')
}

/** Prepends a new entry to the entries list (newest-first order). */
export async function addEntry(entry: GuestEntry): Promise<GuestEntry> {
  const entries = await getEntries()
  entries.unshift(entry) // Add to beginning for newest-first order
  await saveEntries(entries)
  return entry
}

/**
 * Retrieves a single guest entry by its ID.
 * @param id - The entry ID to look up.
 * @returns The matching entry, or `null` if not found.
 */
export async function getEntryById(id: string): Promise<GuestEntry | null> {
  const entries = await getEntries()
  return entries.find(e => e.id === id) || null
}

/**
 * Deletes a guest entry and its associated photo file.
 * @param id - The entry ID to delete.
 * @returns `true` if the entry was found and deleted, `false` if not found.
 */
export async function deleteEntry(id: string): Promise<boolean> {
  const entries = await getEntries()
  const index = entries.findIndex(e => e.id === id)

  if (index === -1) {
    return false
  }

  const entry = entries[index]

  // Delete associated photo if exists
  if (entry.photoUrl) {
    try {
      const photoPath = join(process.cwd(), DATA_DIR, PHOTOS_DIR, entry.photoUrl.split('/').pop()!)
      await fs.unlink(photoPath)
    } catch {
      // Photo might not exist, ignore
    }
  }

  entries.splice(index, 1)
  await saveEntries(entries)
  return true
}

/**
 * Saves a base64-encoded image to disk and returns its API URL.
 * @param base64Data - The full data URI (e.g. `data:image/jpeg;base64,...`).
 * @param entryId - The entry ID used as the filename stem.
 * @returns The URL path for retrieving the photo (e.g. `/api/photos/123.jpg`).
 */
export async function savePhoto(base64Data: string, entryId: string): Promise<string> {
  await ensureDataDir()

  // Extract the base64 content and file type
  const matches = base64Data.match(/^data:image\/([\w+]+);base64,(.+)$/)
  if (!matches) {
    throw new Error('Invalid base64 image format')
  }

  const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1]
  const imageData = matches[2]
  const fileName = `${entryId}.${extension}`
  const filePath = join(process.cwd(), DATA_DIR, PHOTOS_DIR, fileName)

  await fs.writeFile(filePath, imageData, 'base64')

  return `/api/photos/${fileName}`
}

/** Generates a unique ID using the current timestamp and a random suffix. */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
