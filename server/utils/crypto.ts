import { createCipheriv, createDecipheriv, randomBytes, hkdfSync } from 'crypto'

/**
 * AES-256-GCM encryption constants.
 */
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16 // 128-bit authentication tag
const KEY_LENGTH = 32 // 256-bit key

/**
 * Encrypted file header format:
 * [12-byte IV][16-byte auth tag][ciphertext...]
 */
const HEADER_LENGTH = IV_LENGTH + AUTH_TAG_LENGTH

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
    // Dev fallback — deterministic but insecure
    return Buffer.from('0'.repeat(64), 'hex')
  }

  if (keyHex.length !== 64) {
    throw new Error('ENCRYPTION_MASTER_KEY must be a 64-character hex string (32 bytes)')
  }

  return Buffer.from(keyHex, 'hex')
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
 * Output format: [12-byte IV][16-byte auth tag][ciphertext]
 *
 * @param data - The plaintext data to encrypt.
 * @param tenantKey - The 32-byte tenant-derived encryption key.
 * @returns The encrypted data with IV and auth tag prepended.
 */
export function encryptData(data: Buffer, tenantKey: Buffer): Buffer {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, tenantKey, iv, { authTagLength: AUTH_TAG_LENGTH })

  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
  const authTag = cipher.getAuthTag()

  // Prepend IV + auth tag to ciphertext
  return Buffer.concat([iv, authTag, encrypted])
}

/**
 * Decrypts data that was encrypted with `encryptData`.
 *
 * @param encryptedData - The encrypted data with IV and auth tag header.
 * @param tenantKey - The 32-byte tenant-derived encryption key.
 * @returns The decrypted plaintext data.
 * @throws If the auth tag verification fails (data tampered or wrong key).
 */
export function decryptData(encryptedData: Buffer, tenantKey: Buffer): Buffer {
  if (encryptedData.length < HEADER_LENGTH) {
    throw new Error('Encrypted data is too short — missing IV or auth tag')
  }

  const iv = encryptedData.subarray(0, IV_LENGTH)
  const authTag = encryptedData.subarray(IV_LENGTH, HEADER_LENGTH)
  const ciphertext = encryptedData.subarray(HEADER_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, tenantKey, iv, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(ciphertext), decipher.final()])
}
