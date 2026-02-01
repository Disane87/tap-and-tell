import { defineConfig } from 'drizzle-kit'

/**
 * Drizzle Kit configuration for schema management and migrations.
 * Uses PostgreSQL as the database dialect.
 */
export default defineConfig({
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL || process.env.DATABASE_URL || 'postgresql://tapandtell:tapandtell_dev@localhost:5432/tapandtell'
  }
})
