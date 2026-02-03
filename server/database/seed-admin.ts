import { nanoid } from 'nanoid'
import { Pool } from 'pg'
import { hashPassword } from '~~/server/utils/password'
import { createLogger } from '~~/server/utils/logger'

const log = createLogger('seed-admin')

/**
 * Seeds a production admin user if ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are set.
 * Only runs in production. Idempotent — skips if the user already exists.
 *
 * This allows bootstrapping an admin account for the beta phase without
 * hardcoding credentials in the codebase.
 *
 * @param connectionString - PostgreSQL connection string.
 */
export async function seedProductionAdmin(connectionString: string): Promise<void> {
  // Only run in production
  if (process.env.NODE_ENV !== 'production') {
    return
  }

  const adminEmail = process.env.ADMIN_SEED_EMAIL
  const adminPassword = process.env.ADMIN_SEED_PASSWORD
  const adminName = process.env.ADMIN_SEED_NAME || 'Admin'

  // Skip if credentials not configured
  if (!adminEmail || !adminPassword) {
    log.debug('No ADMIN_SEED_EMAIL/PASSWORD configured - skipping admin seed')
    return
  }

  const pool = new Pool({ connectionString })
  const client = await pool.connect()

  try {
    // Check if admin user already exists
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail.toLowerCase()])
    if (existing.rows.length > 0) {
      log.debug('Admin user already exists', { email: adminEmail })
      return
    }

    const userId = nanoid(12)
    const passwordHash = await hashPassword(adminPassword)

    await client.query('BEGIN')

    // Create admin user with isAdmin flag
    await client.query(
      `INSERT INTO users (id, email, password_hash, name, is_admin, beta_participant)
       VALUES ($1, $2, $3, $4, true, true)`,
      [userId, adminEmail.toLowerCase(), passwordHash, adminName]
    )

    await client.query('COMMIT')

    log.success('Production admin user created', { email: adminEmail })
  } catch (error) {
    await client.query('ROLLBACK')
    log.error('Failed to create admin user', {
      error: error instanceof Error ? error.message : String(error)
    })
    // Don't throw - admin seed failure shouldn't crash the server
  } finally {
    client.release()
    await pool.end()
  }
}
