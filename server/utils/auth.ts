import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Admin password from environment. CHANGE IN PRODUCTION!
 */
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

/**
 * Token signing secret from environment. CHANGE IN PRODUCTION!
 */
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'tap-and-tell-secret'

/**
 * Token expiry duration (24 hours in milliseconds).
 */
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000

/**
 * Validates the admin password.
 */
export function validatePassword(password: string): boolean {
  // Use timing-safe comparison to prevent timing attacks
  const expected = Buffer.from(ADMIN_PASSWORD)
  const actual = Buffer.from(password)
  if (expected.length !== actual.length) return false
  return timingSafeEqual(expected, actual)
}

/**
 * Generates a signed admin token with expiry timestamp.
 * Format: base64(timestamp).signature
 */
export function generateToken(): string {
  const expiry = Date.now() + TOKEN_EXPIRY_MS
  const payload = Buffer.from(expiry.toString()).toString('base64')
  const signature = createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('hex')
  return `${payload}.${signature}`
}

/**
 * Validates an admin token.
 * Checks signature and expiry.
 */
export function validateToken(token: string): boolean {
  const parts = token.split('.')
  if (parts.length !== 2) return false

  const [payload, signature] = parts

  // Verify signature
  const expectedSig = createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('hex')

  const sigBuffer = Buffer.from(signature, 'hex')
  const expectedBuffer = Buffer.from(expectedSig, 'hex')

  if (sigBuffer.length !== expectedBuffer.length) return false
  if (!timingSafeEqual(sigBuffer, expectedBuffer)) return false

  // Check expiry
  try {
    const expiry = parseInt(Buffer.from(payload, 'base64').toString(), 10)
    if (isNaN(expiry) || Date.now() > expiry) return false
  } catch {
    return false
  }

  return true
}

/**
 * Extracts and validates the Bearer token from an Authorization header.
 * Returns true if valid, false otherwise.
 */
export function validateAuthHeader(authHeader: string | null): boolean {
  if (!authHeader) return false
  const match = authHeader.match(/^Bearer\s+(.+)$/)
  if (!match) return false
  return validateToken(match[1])
}
