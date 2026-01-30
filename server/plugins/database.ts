import { runMigrations } from '~~/server/database/migrate'
import { seedFromLegacy } from '~~/server/database/seed'

/**
 * Nitro plugin that initializes the database on server start.
 * Runs migrations and seeds from legacy data if available.
 */
export default defineNitroPlugin(() => {
  const dbPath = process.env.DATABASE_URL?.replace('file:', '') || '.data/data.db'
  const dataDir = process.env.DATA_DIR || '.data'

  runMigrations(dbPath)
  seedFromLegacy(dbPath, dataDir)

  console.log('[database] Initialized and ready')
})
