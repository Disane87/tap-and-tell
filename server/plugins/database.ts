import { runMigrations } from '~~/server/database/migrate'
import { seedFromLegacy } from '~~/server/database/seed'
import { seedDevTenant } from '~~/server/database/seed-dev'

/**
 * Nitro plugin that initializes the PostgreSQL database on server start.
 * Runs migrations (including RLS policies), seeds from legacy data if available,
 * and creates a dev tenant in development mode.
 */
export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  const connectionString = config.postgresUrl

  if (!connectionString) {
    console.error('[database] No POSTGRES_URL or DATABASE_URL configured')
    return
  }

  const dataDir = process.env.DATA_DIR || '.data'

  await runMigrations(connectionString)
  await seedFromLegacy(connectionString, dataDir)
  await seedDevTenant(connectionString)

  console.log('[database] PostgreSQL initialized with RLS policies')
})
