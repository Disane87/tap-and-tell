import { nanoid } from 'nanoid'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { Pool } from 'pg'
import { generateEncryptionSalt } from '~~/server/utils/crypto'

/**
 * Seeds the database with existing entries from the legacy JSON storage.
 * Creates a default tenant and migrates all entries to it.
 *
 * This script is idempotent — it skips seeding if entries already exist.
 *
 * @param connectionString - PostgreSQL connection string.
 * @param dataDir - Path to the legacy .data directory.
 */
export async function seedFromLegacy(connectionString: string, dataDir: string): Promise<void> {
  const pool = new Pool({ connectionString })
  const client = await pool.connect()

  try {
    // Check if entries already exist
    const countResult = await client.query('SELECT COUNT(*) as count FROM entries')
    if (parseInt(countResult.rows[0].count, 10) > 0) {
      return
    }

    const entriesFile = join(dataDir, 'entries.json')
    if (!existsSync(entriesFile)) {
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
      return
    }

    if (legacyEntries.length === 0) {
      return
    }

    await client.query('BEGIN')

    // Create a default owner user
    const defaultUserId = nanoid(12)
    const defaultTenantId = nanoid(12)
    const defaultGuestbookId = nanoid(12)
    const encryptionSalt = generateEncryptionSalt()

    await client.query(
      'INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)',
      [defaultUserId, 'admin@tap-and-tell.local', 'migrated:no-login', 'Admin']
    )

    await client.query(
      'INSERT INTO tenants (id, name, owner_id, encryption_salt) VALUES ($1, $2, $3, $4)',
      [defaultTenantId, 'Default Guestbook', defaultUserId, encryptionSalt]
    )

    await client.query(
      'INSERT INTO tenant_members (id, tenant_id, user_id, role) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [nanoid(12), defaultTenantId, defaultUserId, 'owner']
    )

    // Create a default guestbook for legacy entries
    await client.query(
      `INSERT INTO guestbooks (id, tenant_id, name, type, settings) VALUES ($1, $2, $3, $4, $5)`,
      [defaultGuestbookId, defaultTenantId, 'Default Guestbook', 'permanent', '{}']
    )

    // Migrate entries
    for (const entry of legacyEntries) {
      await client.query(
        `INSERT INTO entries (id, guestbook_id, name, message, photo_url, answers, status, rejection_reason, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          entry.id,
          defaultGuestbookId,
          entry.name,
          entry.message,
          entry.photoUrl || null,
          entry.answers ? JSON.stringify(entry.answers) : null,
          entry.status || 'approved',
          entry.rejectionReason || null,
          new Date(entry.createdAt)
        ]
      )
    }

    await client.query('COMMIT')

    console.log(`Seeded ${legacyEntries.length} entries into default tenant ${defaultTenantId}`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}
