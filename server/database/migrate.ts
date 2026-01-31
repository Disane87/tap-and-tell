import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { nanoid } from 'nanoid'

/**
 * Runs database migrations by creating tables if they don't exist.
 * Uses raw SQL for maximum compatibility with both better-sqlite3 and libsql.
 *
 * Also handles data migration from the old tenant→entries schema
 * to the new tenant→guestbooks→entries schema.
 *
 * @param dbPath - Path to the SQLite database file.
 */
export function runMigrations(dbPath: string): void {
  const dir = dirname(dbPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS guestbooks (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'permanent' CHECK(type IN ('permanent', 'event')),
      settings TEXT DEFAULT '{}',
      start_date TEXT,
      end_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_guestbooks_tenant ON guestbooks(tenant_id);

    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      guestbook_id TEXT NOT NULL REFERENCES guestbooks(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      message TEXT NOT NULL,
      photo_url TEXT,
      answers TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      rejection_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_entries_guestbook ON entries(guestbook_id);

    CREATE TABLE IF NOT EXISTS tenant_members (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK(role IN ('owner', 'co_owner')),
      invited_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(tenant_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant ON tenant_members(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_tenant_members_user ON tenant_members(user_id);

    CREATE TABLE IF NOT EXISTS tenant_invites (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'co_owner' CHECK(role IN ('co_owner')),
      invited_by TEXT NOT NULL REFERENCES users(id),
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      accepted_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tenant_invites_token ON tenant_invites(token);
    CREATE INDEX IF NOT EXISTS idx_tenant_invites_email ON tenant_invites(email);
  `)

  // Migrate old entries with tenant_id to new entries with guestbook_id
  migrateOldEntries(db)

  // Drop settings column from tenants if it exists (clean up old schema)
  dropTenantSettingsColumn(db)

  db.close()
}

/**
 * Migrates entries from old tenant_id schema to new guestbook_id schema.
 * For each tenant that has entries with tenant_id, creates a default guestbook
 * and moves the entries to it.
 *
 * @param db - The database connection.
 */
function migrateOldEntries(db: Database.Database): void {
  // Check if old entries table has tenant_id column
  const columns = db.pragma('table_info(entries)') as Array<{ name: string }>
  const hasTenantId = columns.some(c => c.name === 'tenant_id')
  const hasGuestbookId = columns.some(c => c.name === 'guestbook_id')

  if (hasTenantId && !hasGuestbookId) {
    // Old schema detected — need to migrate
    console.log('[migrate] Migrating entries from tenant_id to guestbook_id...')

    // Temporarily disable foreign keys for migration
    db.pragma('foreign_keys = OFF')

    const transaction = db.transaction(() => {
      // Get all unique tenant_ids from entries
      const tenantIds = db.prepare(
        'SELECT DISTINCT tenant_id FROM entries WHERE tenant_id IS NOT NULL'
      ).all() as Array<{ tenant_id: string }>

      for (const { tenant_id } of tenantIds) {
        // Check if this tenant already has a guestbook
        const existing = db.prepare(
          'SELECT id FROM guestbooks WHERE tenant_id = ?'
        ).get(tenant_id) as { id: string } | undefined

        let guestbookId: string
        if (existing) {
          guestbookId = existing.id
        } else {
          // Get tenant settings to copy to guestbook
          const tenant = db.prepare(
            'SELECT name, settings FROM tenants WHERE id = ?'
          ).get(tenant_id) as { name: string; settings: string } | undefined

          guestbookId = nanoid(12)
          const settings = tenant?.settings || '{}'
          const name = tenant?.name || 'Default Guestbook'

          db.prepare(`
            INSERT INTO guestbooks (id, tenant_id, name, type, settings, created_at, updated_at)
            VALUES (?, ?, ?, 'permanent', ?, datetime('now'), datetime('now'))
          `).run(guestbookId, tenant_id, name, settings)
        }

        // Update entries to reference the guestbook
        // We need to create a new entries table with guestbook_id
      }

      // Create new entries table
      db.exec(`
        CREATE TABLE entries_new (
          id TEXT PRIMARY KEY,
          guestbook_id TEXT NOT NULL REFERENCES guestbooks(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          message TEXT NOT NULL,
          photo_url TEXT,
          answers TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          rejection_reason TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `)

      // Copy entries, mapping tenant_id to guestbook_id
      db.exec(`
        INSERT INTO entries_new (id, guestbook_id, name, message, photo_url, answers, status, rejection_reason, created_at)
        SELECT e.id, g.id, e.name, e.message, e.photo_url, e.answers, e.status, e.rejection_reason, e.created_at
        FROM entries e
        INNER JOIN guestbooks g ON g.tenant_id = e.tenant_id;
      `)

      // Drop old entries table, rename new one
      db.exec('DROP TABLE entries;')
      db.exec('ALTER TABLE entries_new RENAME TO entries;')
      db.exec('CREATE INDEX IF NOT EXISTS idx_entries_guestbook ON entries(guestbook_id);')
    })

    transaction()
    db.pragma('foreign_keys = ON')
    console.log('[migrate] Entry migration complete')
  }
}

/**
 * Drops the settings column from tenants table if it exists.
 * Uses the create-copy-drop-rename pattern since SQLite doesn't support DROP COLUMN
 * in older versions.
 *
 * @param db - The database connection.
 */
function dropTenantSettingsColumn(db: Database.Database): void {
  const columns = db.pragma('table_info(tenants)') as Array<{ name: string }>
  const hasSettings = columns.some(c => c.name === 'settings')

  if (hasSettings) {
    console.log('[migrate] Removing settings column from tenants...')
    db.pragma('foreign_keys = OFF')

    const transaction = db.transaction(() => {
      db.exec(`
        CREATE TABLE tenants_new (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        INSERT INTO tenants_new (id, name, owner_id, created_at, updated_at)
        SELECT id, name, owner_id, created_at, updated_at FROM tenants;
        DROP TABLE tenants;
        ALTER TABLE tenants_new RENAME TO tenants;
      `)
    })

    transaction()
    db.pragma('foreign_keys = ON')
    console.log('[migrate] Settings column removed from tenants')
  }
}
