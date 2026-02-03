import { runMigrations } from '~~/server/database/migrate'
import { seedFromLegacy } from '~~/server/database/seed'
import { seedDevTenant } from '~~/server/database/seed-dev'
import { createLogger } from '~~/server/utils/logger'

const log = createLogger('database')

/**
 * Nitro plugin that initializes the PostgreSQL database on server start.
 * Runs migrations (including RLS policies), seeds from legacy data if available,
 * and creates a dev tenant in development mode.
 */
export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  const connectionString = config.postgresUrl

  if (!connectionString) {
    log.error('No POSTGRES_URL or DATABASE_URL configured - database features disabled')
    return
  }

  const dataDir = process.env.DATA_DIR || '.data'

  log.info('Initializing database connection...')

  try {
    // Run schema migrations
    log.info('Running schema migrations...')
    await runMigrations(connectionString)
    log.success('Schema migrations complete')

    // Seed from legacy data if available
    log.info('Checking for legacy data to migrate...')
    await seedFromLegacy(connectionString, dataDir)

    // Seed dev tenant in development
    if (process.env.NODE_ENV !== 'production') {
      log.info('Setting up development tenant...')
      await seedDevTenant(connectionString)
    }

    log.success('Database initialization complete')
  } catch (error) {
    log.error('Database initialization failed', {
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
})
