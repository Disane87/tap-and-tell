import { scrypt, randomBytes, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

/**
 * Hashes a password using Node.js built-in crypto.scrypt.
 * Returns a string in the format: salt:hash (both hex-encoded).
 *
 * @param password - The plaintext password to hash.
 * @returns The hashed password string.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const hash = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${hash.toString('hex')}`
}

/**
 * Verifies a password against a stored hash.
 * Uses timing-safe comparison to prevent timing attacks.
 *
 * @param password - The plaintext password to verify.
 * @param storedHash - The stored hash in salt:hash format.
 * @returns True if the password matches.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) return false

  const hashBuffer = Buffer.from(hash, 'hex')
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer

  if (hashBuffer.length !== derivedKey.length) return false
  return timingSafeEqual(hashBuffer, derivedKey)
}
