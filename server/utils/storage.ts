import { promises as fs } from 'fs'
import { join } from 'path'
import type { GuestEntry } from '../../app/types/guest'

const DATA_DIR = process.env.DATA_DIR || '.data'
const ENTRIES_FILE = 'entries.json'
const PHOTOS_DIR = 'photos'

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

async function getEntriesFilePath(): Promise<string> {
  await ensureDataDir()
  return join(process.cwd(), DATA_DIR, ENTRIES_FILE)
}

export async function getEntries(): Promise<GuestEntry[]> {
  const filePath = await getEntriesFilePath()

  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data) as GuestEntry[]
  } catch {
    return []
  }
}

export async function saveEntries(entries: GuestEntry[]): Promise<void> {
  const filePath = await getEntriesFilePath()
  await fs.writeFile(filePath, JSON.stringify(entries, null, 2), 'utf-8')
}

export async function addEntry(entry: GuestEntry): Promise<GuestEntry> {
  const entries = await getEntries()
  entries.unshift(entry) // Add to beginning for newest-first order
  await saveEntries(entries)
  return entry
}

export async function getEntryById(id: string): Promise<GuestEntry | null> {
  const entries = await getEntries()
  return entries.find(e => e.id === id) || null
}

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

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
