import { defineConfig } from 'drizzle-kit'

/**
 * Drizzle Kit configuration for schema management and migrations.
 */
export default defineConfig({
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL?.replace('file:', '') || '.data/data.db'
  }
})
