/**
 * Server-side logging utility with consistent formatting.
 * Provides structured logging for different server components.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success'

interface LogOptions {
  /** Component/module name for the log prefix */
  component: string
  /** Whether to include timestamp (default: true in production) */
  timestamp?: boolean
}

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  info: COLORS.blue,
  warn: COLORS.yellow,
  error: COLORS.red,
  debug: COLORS.dim,
  success: COLORS.green
}

const LEVEL_SYMBOLS: Record<LogLevel, string> = {
  info: 'ℹ',
  warn: '⚠',
  error: '✖',
  debug: '○',
  success: '✔'
}

/**
 * Creates a logger instance for a specific component.
 */
export function createLogger(component: string) {
  const isProduction = process.env.NODE_ENV === 'production'
  const isDev = !isProduction

  function formatMessage(level: LogLevel, message: string, data?: Record<string, unknown>): string {
    const color = LEVEL_COLORS[level]
    const symbol = LEVEL_SYMBOLS[level]
    const timestamp = isProduction ? `${new Date().toISOString()} ` : ''
    const prefix = `${color}${symbol}${COLORS.reset} [${COLORS.cyan}${component}${COLORS.reset}]`

    let output = `${timestamp}${prefix} ${message}`

    if (data && Object.keys(data).length > 0) {
      const dataStr = Object.entries(data)
        .map(([k, v]) => `${COLORS.dim}${k}=${COLORS.reset}${JSON.stringify(v)}`)
        .join(' ')
      output += ` ${dataStr}`
    }

    return output
  }

  return {
    info: (message: string, data?: Record<string, unknown>) => {
      console.log(formatMessage('info', message, data))
    },

    success: (message: string, data?: Record<string, unknown>) => {
      console.log(formatMessage('success', message, data))
    },

    warn: (message: string, data?: Record<string, unknown>) => {
      console.warn(formatMessage('warn', message, data))
    },

    error: (message: string, data?: Record<string, unknown>) => {
      console.error(formatMessage('error', message, data))
    },

    debug: (message: string, data?: Record<string, unknown>) => {
      if (isDev) {
        console.log(formatMessage('debug', message, data))
      }
    },

    /** Log a section header for grouping related logs */
    section: (title: string) => {
      const line = '─'.repeat(40)
      console.log(`\n${COLORS.dim}${line}${COLORS.reset}`)
      console.log(`${COLORS.bright}${COLORS.magenta}▸ ${title}${COLORS.reset}`)
      console.log(`${COLORS.dim}${line}${COLORS.reset}`)
    },

    /** Log a key-value pair in a formatted way */
    kv: (key: string, value: unknown) => {
      console.log(`  ${COLORS.dim}${key}:${COLORS.reset} ${value}`)
    }
  }
}

/** Pre-configured loggers for common components */
export const serverLog = createLogger('server')
export const dbLog = createLogger('database')
export const authLog = createLogger('auth')
export const apiLog = createLogger('api')
