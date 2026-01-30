import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql'
import Database from 'better-sqlite3'
import { createClient } from '@libsql/client'
import * as schema from './schema'

/**
 * Singleton database instance.
 * Uses Turso (libsql) in production, better-sqlite3 locally.
 */
let _db: ReturnType<typeof drizzleSqlite<typeof schema>> | ReturnType<typeof drizzleLibsql<typeof schema>> | null = null

/**
 * Returns the database instance, creating it if necessary.
 * Automatically selects the appropriate driver based on environment.
 *
 * @returns Drizzle ORM database instance with schema.
 */
export function useDb() {
  if (_db) return _db

  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  if (tursoUrl && tursoToken) {
    const client = createClient({
      url: tursoUrl,
      authToken: tursoToken
    })
    _db = drizzleLibsql(client, { schema })
  } else {
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || '.data/data.db'
    const sqlite = new Database(dbPath)
    sqlite.pragma('journal_mode = WAL')
    sqlite.pragma('foreign_keys = ON')
    _db = drizzleSqlite(sqlite, { schema })
  }

  return _db
}
