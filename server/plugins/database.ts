import { runMigrations } from '~~/server/database/migrate'
import { seedFromLegacy } from '~~/server/database/seed'
import { seedDevTenant } from '~~/server/database/seed-dev'

/**
 * Nitro plugin that initializes the database on server start.
 * Runs migrations, seeds from legacy data if available,
 * and creates a dev tenant in development mode.
 */
export default defineNitroPlugin(async () => {
  const dbPath = process.env.DATABASE_URL?.replace('file:', '') || '.data/data.db'
  const dataDir = process.env.DATA_DIR || '.data'

  runMigrations(dbPath)
  seedFromLegacy(dbPath, dataDir)
  await seedDevTenant(dbPath)

  console.log('[database] Initialized and ready')
})
