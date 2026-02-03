import { createLogger } from '~~/server/utils/logger'
import { getBetaMode, getAdminEmails } from '~~/server/utils/beta-config'

const log = createLogger('startup')

/**
 * Nitro plugin that logs server configuration and status on startup.
 * Runs after database initialization to provide a complete status overview.
 */
export default defineNitroPlugin(() => {
  const isProduction = process.env.NODE_ENV === 'production'
  const config = useRuntimeConfig()

  log.section('Tap & Tell Server Starting')

  // Environment
  log.kv('Environment', isProduction ? 'production' : 'development')
  log.kv('Node Version', process.version)

  // Database
  const dbUrl = config.postgresUrl
  if (dbUrl) {
    // Mask password in connection string for logging
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@')
    log.kv('Database', maskedUrl)
  } else {
    log.warn('No database URL configured')
  }

  // Beta Mode
  const betaMode = getBetaMode()
  const betaModeLabels: Record<string, string> = {
    private: 'Private Beta (invite-only)',
    waitlist: 'Public Waitlist (invite required)',
    open: 'Open Registration'
  }
  log.kv('Beta Mode', `${betaMode} - ${betaModeLabels[betaMode]}`)

  // Admin Emails
  const adminEmails = getAdminEmails()
  if (adminEmails.length > 0) {
    log.kv('Admin Emails', adminEmails.join(', '))
  } else {
    log.kv('Admin Emails', '(none configured)')
  }

  // Data Directory
  const dataDir = process.env.DATA_DIR || '.data'
  log.kv('Data Directory', dataDir)

  // Email Configuration
  const hasResendKey = !!process.env.RESEND_API_KEY
  log.kv('Email Provider', hasResendKey ? 'Resend (configured)' : 'Console (development)')

  // Security Status
  if (!isProduction) {
    console.log('')
    log.warn('Running in development mode - security features relaxed')
  }

  console.log('')
  log.success('Server configuration loaded')
})
