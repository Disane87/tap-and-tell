import { createCipheriv, createDecipheriv, randomBytes, hkdfSync } from 'crypto'
import { createLogger } from './logger'

const log = createLogger('crypto')

/**
 * AES-256-GCM encryption constants.
 */
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16 // 128-bit authentication tag
const KEY_LENGTH = 32 // 256-bit key

/**
 * Legacy encrypted file header format (v0, no version byte):
 * [12-byte IV][16-byte auth tag][ciphertext...]
 */
const LEGACY_HEADER_LENGTH = IV_LENGTH + AUTH_TAG_LENGTH

/**
 * Versioned encrypted file header format (v1+):
 * [1-byte version][12-byte IV][16-byte auth tag][ciphertext...]
 */
const VERSION_BYTE_LENGTH = 1
const VERSIONED_HEADER_LENGTH = VERSION_BYTE_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH

/** Current encryption format version. */
const CURRENT_VERSION = 1

/**
 * Returns the master encryption key from environment.
 * Throws if not configured in production.
 *
 * @returns The 32-byte master key as a Buffer.
 */
function getMasterKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_MASTER_KEY

  if (!keyHex) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_MASTER_KEY must be set in production')
    }
    // The insecure zero-key fallback is only permitted under the test runner
    // or when explicitly opted in. Any other environment (staging, preview,
    // mis-configured dev) MUST fail loudly rather than silently encrypting all
    // data with a publicly known zero key.
    if (!isInsecureDevKeyAllowed()) {
      throw new Error(
        'ENCRYPTION_MASTER_KEY must be set. The insecure dev fallback key is '
        + 'only available under the test runner or when ALLOW_INSECURE_DEV_KEY=1 is set.'
      )
    }
    // Dev fallback — deterministic but insecure
    return Buffer.from('0'.repeat(64), 'hex')
  }

  if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    throw new Error('ENCRYPTION_MASTER_KEY must be a 64-character hex string (32 bytes)')
  }

  const key = Buffer.from(keyHex, 'hex')
  if (Buffer.byteLength(key) !== KEY_LENGTH) {
    throw new Error('ENCRYPTION_MASTER_KEY must decode to exactly 32 bytes')
  }

  return key
}

/**
 * Determines whether the insecure zero-key dev fallback may be used.
 *
 * Allowed only under the Vitest test runner (`VITEST`), when `NODE_ENV === 'test'`,
 * or when explicitly opted in via `ALLOW_INSECURE_DEV_KEY=1`. This prevents a
 * mis-configured staging/preview environment from silently using the public key.
 *
 * @returns True if the insecure fallback key is permitted.
 */
function isInsecureDevKeyAllowed(): boolean {
  return (
    !!process.env.VITEST
    || process.env.NODE_ENV === 'test'
    || process.env.ALLOW_INSECURE_DEV_KEY === '1'
  )
}

/**
 * Derives a per-tenant encryption key using HKDF-SHA256.
 *
 * The master key is expanded with the tenant-specific salt to produce
 * a unique 256-bit key per tenant. Compromising one tenant's data
 * does not reveal the master key or other tenants' keys.
 *
 * @param tenantSalt - Hex-encoded per-tenant salt (stored in DB).
 * @returns A 32-byte derived key for the tenant.
 */
export function deriveTenantKey(tenantSalt: string): Buffer {
  const masterKey = getMasterKey()
  const salt = Buffer.from(tenantSalt, 'hex')
  const info = Buffer.from('tap-and-tell-photo-encryption', 'utf-8')

  return Buffer.from(hkdfSync('sha256', masterKey, salt, info, KEY_LENGTH))
}

/**
 * Generates a random encryption salt for a new tenant.
 *
 * @returns A 32-byte hex-encoded salt string.
 */
export function generateEncryptionSalt(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Encrypts data using AES-256-GCM with a tenant-specific key.
 *
 * Output format (v1): [1-byte version=0x01][12-byte IV][16-byte auth tag][ciphertext]
 *
 * @param data - The plaintext data to encrypt.
 * @param tenantKey - The 32-byte tenant-derived encryption key.
 * @returns The encrypted data with version byte, IV, and auth tag prepended.
 */
export function encryptData(data: Buffer, tenantKey: Buffer): Buffer {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, tenantKey, iv, { authTagLength: AUTH_TAG_LENGTH })

  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
  const authTag = cipher.getAuthTag()

  // Prepend version byte + IV + auth tag to ciphertext
  const versionByte = Buffer.alloc(1, CURRENT_VERSION)
  return Buffer.concat([versionByte, iv, authTag, encrypted])
}

/**
 * Decrypts data that was encrypted with `encryptData`.
 *
 * Supports both versioned format (v1+) and legacy format (no version byte)
 * for backward compatibility during key rotation migration.
 *
 * Detection heuristic: if the first byte is 0x01, treat as versioned format.
 * Legacy data starts with a random 12-byte IV, where the first byte being
 * exactly 0x01 is statistically unlikely (~0.4%) and would only cause a
 * one-byte offset error that GCM auth tag verification would catch.
 *
 * @param encryptedData - The encrypted data (versioned or legacy format).
 * @param tenantKey - The 32-byte tenant-derived encryption key.
 * @returns The decrypted plaintext data.
 * @throws If the auth tag verification fails (data tampered or wrong key).
 */
export function decryptData(encryptedData: Buffer, tenantKey: Buffer): Buffer {
  if (encryptedData.length < LEGACY_HEADER_LENGTH) {
    throw new Error('Encrypted data is too short — missing IV or auth tag')
  }

  const firstByte = encryptedData[0]

  // Versioned format: first byte is the version number (0x01)
  if (firstByte === CURRENT_VERSION && encryptedData.length >= VERSIONED_HEADER_LENGTH) {
    // Try versioned format first
    try {
      return decryptVersioned(encryptedData, tenantKey)
    } catch (error) {
      // Programming errors (TypeError/RangeError) indicate a bug, not corrupt or
      // legacy data — rethrow them instead of masking the real cause.
      if (error instanceof TypeError || error instanceof RangeError) {
        throw error
      }
      // Auth-tag / decoding failures are expected only in the rare case where
      // genuine legacy data happens to start with 0x01. Log the swallowed error
      // so real corruption is not silently hidden, then fall through to legacy.
      log.debug('Versioned decryption failed, falling back to legacy format', {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  // Legacy format: [12-byte IV][16-byte auth tag][ciphertext]
  return decryptLegacy(encryptedData, tenantKey)
}

/**
 * Decrypts data in the versioned format (v1).
 * Format: [1-byte version][12-byte IV][16-byte auth tag][ciphertext]
 *
 * @param encryptedData - The versioned encrypted data.
 * @param tenantKey - The 32-byte tenant-derived encryption key.
 * @returns The decrypted plaintext data.
 */
function decryptVersioned(encryptedData: Buffer, tenantKey: Buffer): Buffer {
  const iv = encryptedData.subarray(VERSION_BYTE_LENGTH, VERSION_BYTE_LENGTH + IV_LENGTH)
  const authTag = encryptedData.subarray(VERSION_BYTE_LENGTH + IV_LENGTH, VERSIONED_HEADER_LENGTH)
  const ciphertext = encryptedData.subarray(VERSIONED_HEADER_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, tenantKey, iv, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(ciphertext), decipher.final()])
}

/**
 * Decrypts data in the legacy format (no version byte).
 * Format: [12-byte IV][16-byte auth tag][ciphertext]
 *
 * @param encryptedData - The legacy encrypted data.
 * @param tenantKey - The 32-byte tenant-derived encryption key.
 * @returns The decrypted plaintext data.
 */
function decryptLegacy(encryptedData: Buffer, tenantKey: Buffer): Buffer {
  const iv = encryptedData.subarray(0, IV_LENGTH)
  const authTag = encryptedData.subarray(IV_LENGTH, LEGACY_HEADER_LENGTH)
  const ciphertext = encryptedData.subarray(LEGACY_HEADER_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, tenantKey, iv, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(ciphertext), decipher.final()])
}

/**
 * Retrieves and derives the encryption key for a tenant.
 * Uses the tenant's salt from the database combined with the master key.
 *
 * This function is exported for use by storage and upload utilities.
 * Uses the non-RLS db since we need tenant data regardless of context.
 *
 * @param tenantId - The tenant ID.
 * @returns The derived 32-byte tenant encryption key.
 * @throws Error if the tenant has no encryption salt configured.
 */
export async function getTenantEncryptionKey(tenantId: string): Promise<Buffer> {
  // Dynamic import to avoid circular dependency
  const { useDrizzle } = await import('~~/server/utils/drizzle')
  const { tenants } = await import('~~/server/database/schema')
  const { eq } = await import('drizzle-orm')

  const db = useDrizzle()
  const rows = await db.select({ encryptionSalt: tenants.encryptionSalt })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
  const tenant = rows[0]

  if (!tenant?.encryptionSalt) {
    throw new Error(`Tenant ${tenantId} has no encryption salt configured`)
  }

  return deriveTenantKey(tenant.encryptionSalt)
}
