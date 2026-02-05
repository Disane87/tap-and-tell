import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

/**
 * TOTP configuration constants.
 */
const TOTP_PERIOD = 30       // Time step in seconds
const TOTP_DIGITS = 6        // Number of digits in the OTP
const TOTP_WINDOW = 1        // Number of periods to check before/after current

/**
 * Generates a random TOTP secret (base32-encoded, 20 bytes).
 *
 * @returns The base32-encoded secret string.
 */
export function generateTotpSecret(): string {
  const buffer = randomBytes(20)
  return encodeBase32(buffer)
}

/**
 * Generates the current TOTP code for a given secret.
 *
 * @param secret - The base32-encoded secret.
 * @param timestamp - Optional timestamp override (default: now).
 * @returns The 6-digit TOTP code.
 */
export function generateTotp(secret: string, timestamp?: number): string {
  const time = Math.floor((timestamp ?? Date.now()) / 1000 / TOTP_PERIOD)
  return hotpGenerate(secret, time)
}

/**
 * Verifies a TOTP code against the secret, checking the current and adjacent time windows.
 *
 * @param secret - The base32-encoded secret.
 * @param code - The 6-digit code to verify.
 * @param timestamp - Optional timestamp override (default: now).
 * @returns True if the code is valid within the window.
 */
export function verifyTotp(secret: string, code: string, timestamp?: number): boolean {
  if (!code || code.length !== TOTP_DIGITS) return false
  const time = Math.floor((timestamp ?? Date.now()) / 1000 / TOTP_PERIOD)

  for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
    const expected = hotpGenerate(secret, time + i)
    if (timingSafeCompare(code, expected)) return true
  }
  return false
}

/**
 * Generates a TOTP provisioning URI for QR code generation.
 *
 * @param secret - The base32-encoded secret.
 * @param email - The user's email address.
 * @param issuer - The service name (default: 'Tap & Tell').
 * @returns The otpauth:// URI string.
 */
export function generateTotpUri(secret: string, email: string, issuer = 'Tap & Tell'): string {
  const encodedIssuer = encodeURIComponent(issuer)
  const encodedEmail = encodeURIComponent(email)
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`
}

/**
 * HOTP generation (RFC 4226). Underlying mechanism for TOTP.
 */
function hotpGenerate(secret: string, counter: number): string {
  const key = decodeBase32(secret)

  // Convert counter to 8-byte big-endian buffer
  const counterBuffer = Buffer.alloc(8)
  let tmp = counter
  for (let i = 7; i >= 0; i--) {
    counterBuffer[i] = tmp & 0xff
    tmp = Math.floor(tmp / 256)
  }

  const hmac = createHmac('sha1', key)
  hmac.update(counterBuffer)
  const hmacResult = hmac.digest()

  // Dynamic truncation
  const offset = hmacResult[hmacResult.length - 1]! & 0xf
  const code = (
    ((hmacResult[offset]! & 0x7f) << 24) |
    ((hmacResult[offset + 1]! & 0xff) << 16) |
    ((hmacResult[offset + 2]! & 0xff) << 8) |
    (hmacResult[offset + 3]! & 0xff)
  ) % Math.pow(10, TOTP_DIGITS)

  return code.toString().padStart(TOTP_DIGITS, '0')
}

/**
 * Timing-safe string comparison.
 */
function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return timingSafeEqual(bufA, bufB)
}

// --- Base32 encoding/decoding (RFC 4648) ---

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function encodeBase32(buffer: Buffer): string {
  let bits = 0
  let value = 0
  let output = ''

  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  /* v8 ignore next 3 */
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  }

  return output
}

function decodeBase32(encoded: string): Buffer {
  const cleaned = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = 0
  let value = 0
  const output: number[] = []

  for (const char of cleaned) {
    value = (value << 5) | BASE32_ALPHABET.indexOf(char)
    bits += 5
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }

  return Buffer.from(output)
}
