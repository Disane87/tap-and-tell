import { randomUUID } from 'crypto'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import Database from 'better-sqlite3'
import { runMigrations } from './migrate'

/**
 * Seeds the database with existing entries from the legacy JSON storage.
 * Creates a default tenant and migrates all entries to it.
 *
 * This script is idempotent — it skips seeding if entries already exist.
 *
 * @param dbPath - Path to the SQLite database file.
 * @param dataDir - Path to the legacy .data directory.
 */
export function seedFromLegacy(dbPath: string, dataDir: string): void {
  runMigrations(dbPath)

  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Check if entries already exist
  const count = db.prepare('SELECT COUNT(*) as count FROM entries').get() as { count: number }
  if (count.count > 0) {
    db.close()
    return
  }

  const entriesFile = join(dataDir, 'entries.json')
  if (!existsSync(entriesFile)) {
    db.close()
    return
  }

  let legacyEntries: Array<{
    id: string
    name: string
    message: string
    photoUrl?: string
    answers?: Record<string, unknown>
    createdAt: string
    status?: string
    rejectionReason?: string
  }>

  try {
    const data = readFileSync(entriesFile, 'utf-8')
    legacyEntries = JSON.parse(data)
  } catch {
    db.close()
    return
  }

  if (legacyEntries.length === 0) {
    db.close()
    return
  }

  // Create a default owner user
  const defaultUserId = randomUUID()
  const defaultTenantId = randomUUID()

  const insertUser = db.prepare(
    'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)'
  )
  // Default password hash for 'admin123' — owner should change this
  insertUser.run(defaultUserId, 'admin@tap-and-tell.local', 'migrated:no-login', 'Admin')

  // Create default tenant
  const insertTenant = db.prepare(
    'INSERT INTO tenants (id, name, owner_id) VALUES (?, ?, ?)'
  )
  insertTenant.run(defaultTenantId, 'Default Guestbook', defaultUserId)

  // Migrate entries
  const insertEntry = db.prepare(`
    INSERT INTO entries (id, tenant_id, name, message, photo_url, answers, status, rejection_reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction(() => {
    for (const entry of legacyEntries) {
      insertEntry.run(
        entry.id,
        defaultTenantId,
        entry.name,
        entry.message,
        entry.photoUrl || null,
        entry.answers ? JSON.stringify(entry.answers) : null,
        entry.status || 'approved',
        entry.rejectionReason || null,
        entry.createdAt
      )
    }
  })

  transaction()
  db.close()

  console.log(`Seeded ${legacyEntries.length} entries into default tenant ${defaultTenantId}`)
}
