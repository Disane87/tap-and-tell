import { randomBytes, createHmac, timingSafeEqual } from 'crypto'

/**
 * CSRF secret used for HMAC signing of tokens.
 */
const CSRF_SECRET = process.env.CSRF_SECRET || 'csrf-secret-change-in-production'

/**
 * Generates a CSRF token.
 * Format: random.hmac(random)
 *
 * @returns The CSRF token string.
 */
export function generateCsrfToken(): string {
  const random = randomBytes(32).toString('hex')
  const signature = createHmac('sha256', CSRF_SECRET).update(random).digest('hex')
  return `${random}.${signature}`
}

/**
 * Validates a CSRF token by verifying its HMAC signature.
 *
 * @param token - The token to validate.
 * @returns True if valid.
 */
export function validateCsrfToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [random, signature] = parts
  if (!random || !signature) return false
  const expected = createHmac('sha256', CSRF_SECRET).update(random).digest('hex')
  // Use timing-safe comparison
  if (expected.length !== signature.length) return false
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))
}
