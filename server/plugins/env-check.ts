import { createLogger } from '~~/server/utils/logger'

const log = createLogger('env-check')

/**
 * Nitro plugin that validates environment variables on startup.
 *
 * In production: aborts startup if insecure default secrets are detected.
 * In development: logs warnings for missing or insecure values.
 */
export default defineNitroPlugin(() => {
  const isProduction = process.env.NODE_ENV === 'production'

  /** Known insecure default values that MUST be overridden in production. */
  const insecureDefaults: Record<string, string[]> = {
    JWT_SECRET: ['jwt-secret-change-in-production', 'insecure-jwt-secret', ''],
    CSRF_SECRET: ['csrf-secret-change-in-production', 'insecure-csrf-secret', '']
  }

  const errors: string[] = []
  const warnings: string[] = []

  // Check secrets against insecure defaults
  for (const [key, defaults] of Object.entries(insecureDefaults)) {
    const value = process.env[key] || ''
    if (defaults.includes(value) || !value) {
      if (isProduction) {
        errors.push(`${key} is using an insecure default value. Set a secure value in production.`)
      } else {
        warnings.push(`${key} is using an insecure default value`)
      }
    }
  }

  // Check ENCRYPTION_MASTER_KEY (required in production)
  const encryptionKey = process.env.ENCRYPTION_MASTER_KEY || ''
  if (!encryptionKey || encryptionKey.length < 64) {
    if (isProduction) {
      errors.push('ENCRYPTION_MASTER_KEY is missing or too short (must be 64 hex chars). Required in production.')
    } else {
      warnings.push('ENCRYPTION_MASTER_KEY not set - using dev fallback')
    }
  }

  // Optional: check RESEND_API_KEY
  if (!process.env.RESEND_API_KEY) {
    warnings.push('RESEND_API_KEY not set - emails logged to console')
  }

  // Log warnings (grouped)
  if (warnings.length > 0) {
    log.warn(`${warnings.length} configuration warning(s):`)
    for (const warning of warnings) {
      log.kv('  •', warning)
    }
  }

  // In production, abort on errors
  if (isProduction && errors.length > 0) {
    log.error('Fatal configuration errors detected:')
    for (const error of errors) {
      log.kv('  •', error)
    }
    log.error('Aborting startup due to insecure configuration')
    process.exit(1)
  }
})
