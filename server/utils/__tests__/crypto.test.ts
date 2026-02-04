import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { deriveTenantKey, generateEncryptionSalt, encryptData, decryptData } from '../crypto'

/**
 * Unit tests for AES-256-GCM encryption utilities.
 * Tests key derivation, encryption/decryption, and format compatibility.
 */
describe('crypto utilities', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv }
    // Set a test master key (64 hex chars = 32 bytes)
    process.env.ENCRYPTION_MASTER_KEY = 'a'.repeat(64)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('generateEncryptionSalt', () => {
    it('should generate a 64-character hex string', () => {
      const salt = generateEncryptionSalt()
      expect(salt).toHaveLength(64)
      expect(/^[0-9a-f]+$/.test(salt)).toBe(true)
    })

    it('should generate unique salts', () => {
      const salt1 = generateEncryptionSalt()
      const salt2 = generateEncryptionSalt()
      expect(salt1).not.toBe(salt2)
    })

    it('should generate valid hex bytes', () => {
      const salt = generateEncryptionSalt()
      const buffer = Buffer.from(salt, 'hex')
      expect(buffer).toHaveLength(32) // 32 bytes = 64 hex chars
    })
  })

  describe('deriveTenantKey', () => {
    it('should derive a 32-byte key from tenant salt', () => {
      const salt = generateEncryptionSalt()
      const key = deriveTenantKey(salt)
      expect(key).toBeInstanceOf(Buffer)
      expect(key).toHaveLength(32)
    })

    it('should derive different keys for different salts', () => {
      const salt1 = generateEncryptionSalt()
      const salt2 = generateEncryptionSalt()

      const key1 = deriveTenantKey(salt1)
      const key2 = deriveTenantKey(salt2)

      expect(key1.equals(key2)).toBe(false)
    })

    it('should derive consistent key for same salt', () => {
      const salt = generateEncryptionSalt()
      const key1 = deriveTenantKey(salt)
      const key2 = deriveTenantKey(salt)

      expect(key1.equals(key2)).toBe(true)
    })

    it('should use dev fallback key when no master key is set', () => {
      delete process.env.ENCRYPTION_MASTER_KEY
      process.env.NODE_ENV = 'development'

      const salt = generateEncryptionSalt()
      const key = deriveTenantKey(salt)
      expect(key).toHaveLength(32)
    })

    it('should throw in production without master key', () => {
      delete process.env.ENCRYPTION_MASTER_KEY
      process.env.NODE_ENV = 'production'

      const salt = generateEncryptionSalt()
      expect(() => deriveTenantKey(salt)).toThrow('ENCRYPTION_MASTER_KEY must be set in production')
    })

    it('should throw for invalid master key length', () => {
      process.env.ENCRYPTION_MASTER_KEY = 'tooshort'

      const salt = generateEncryptionSalt()
      expect(() => deriveTenantKey(salt)).toThrow('ENCRYPTION_MASTER_KEY must be a 64-character hex string')
    })
  })

  describe('encryptData', () => {
    it('should encrypt data with a tenant key', () => {
      const salt = generateEncryptionSalt()
      const key = deriveTenantKey(salt)
      const plaintext = Buffer.from('Hello, World!')

      const encrypted = encryptData(plaintext, key)

      expect(encrypted).toBeInstanceOf(Buffer)
      expect(encrypted.length).toBeGreaterThan(plaintext.length)
    })

    it('should produce versioned format (starts with 0x01)', () => {
      const salt = generateEncryptionSalt()
      const key = deriveTenantKey(salt)
      const plaintext = Buffer.from('Test data')

      const encrypted = encryptData(plaintext, key)

      // First byte should be version 1
      expect(encrypted[0]).toBe(1)
    })

    it('should produce different ciphertext for same plaintext (random IV)', () => {
      const salt = generateEncryptionSalt()
      const key = deriveTenantKey(salt)
      const plaintext = Buffer.from('Same data')

      const encrypted1 = encryptData(plaintext, key)
      const encrypted2 = encryptData(plaintext, key)

      // Ciphertexts should differ due to random IV
      expect(encrypted1.equals(encrypted2)).toBe(false)
    })

    it('should handle empty data', () => {
      const salt = generateEncryptionSalt()
      const key = deriveTenantKey(salt)
      const plaintext = Buffer.from('')

      const encrypted = encryptData(plaintext, key)

      // Should have version byte (1) + IV (12) + auth tag (16) = 29 bytes minimum
      expect(encrypted.length).toBeGreaterThanOrEqual(29)
    })

    it('should handle large data', () => {
      const salt = generateEncryptionSalt()
      const key = deriveTenantKey(salt)
      // 1MB of data
      const plaintext = Buffer.alloc(1024 * 1024, 'x')

      const encrypted = encryptData(plaintext, key)

      expect(encrypted.length).toBeGreaterThan(plaintext.length)
    })
  })

  describe('decryptData', () => {
    it('should decrypt data encrypted with encryptData', () => {
      const salt = generateEncryptionSalt()
      const key = deriveTenantKey(salt)
      const originalText = 'Hello, World! 🌍'
      const plaintext = Buffer.from(originalText)

      const encrypted = encryptData(plaintext, key)
      const decrypted = decryptData(encrypted, key)

      expect(decrypted.toString()).toBe(originalText)
    })

    it('should decrypt empty data', () => {
      const salt = generateEncryptionSalt()
      const key = deriveTenantKey(salt)
      const plaintext = Buffer.from('')

      const encrypted = encryptData(plaintext, key)
      const decrypted = decryptData(encrypted, key)

      expect(decrypted.toString()).toBe('')
    })

    it('should decrypt large data', () => {
      const salt = generateEncryptionSalt()
      const key = deriveTenantKey(salt)
      // 100KB of data
      const originalText = 'x'.repeat(100 * 1024)
      const plaintext = Buffer.from(originalText)

      const encrypted = encryptData(plaintext, key)
      const decrypted = decryptData(encrypted, key)

      expect(decrypted.toString()).toBe(originalText)
    })

    it('should throw for data encrypted with different key', () => {
      const salt1 = generateEncryptionSalt()
      const salt2 = generateEncryptionSalt()
      const key1 = deriveTenantKey(salt1)
      const key2 = deriveTenantKey(salt2)

      const plaintext = Buffer.from('Secret data')
      const encrypted = encryptData(plaintext, key1)

      // Decrypting with wrong key should fail
      expect(() => decryptData(encrypted, key2)).toThrow()
    })

    it('should throw for tampered data', () => {
      const salt = generateEncryptionSalt()
      const key = deriveTenantKey(salt)
      const plaintext = Buffer.from('Original data')

      const encrypted = encryptData(plaintext, key)

      // Tamper with the ciphertext
      encrypted[encrypted.length - 1] ^= 0xff

      // Should fail authentication
      expect(() => decryptData(encrypted, key)).toThrow()
    })

    it('should throw for truncated data', () => {
      const salt = generateEncryptionSalt()
      const key = deriveTenantKey(salt)

      // Data too short to contain IV and auth tag
      const truncated = Buffer.from([1, 2, 3])

      expect(() => decryptData(truncated, key)).toThrow('Encrypted data is too short')
    })

    it('should handle binary data', () => {
      const salt = generateEncryptionSalt()
      const key = deriveTenantKey(salt)

      // Binary data with various byte values
      const plaintext = Buffer.from([0x00, 0xff, 0x01, 0xfe, 0x7f, 0x80])

      const encrypted = encryptData(plaintext, key)
      const decrypted = decryptData(encrypted, key)

      expect(decrypted.equals(plaintext)).toBe(true)
    })
  })

  describe('round-trip encryption', () => {
    it('should preserve data integrity through encrypt/decrypt cycle', () => {
      const salt = generateEncryptionSalt()
      const key = deriveTenantKey(salt)

      const testCases = [
        'Simple ASCII text',
        'Unicode: 你好世界 🌍 مرحبا',
        '',
        'a'.repeat(10000),
        JSON.stringify({ key: 'value', nested: { array: [1, 2, 3] } })
      ]

      for (const testCase of testCases) {
        const plaintext = Buffer.from(testCase)
        const encrypted = encryptData(plaintext, key)
        const decrypted = decryptData(encrypted, key)

        expect(decrypted.toString()).toBe(testCase)
      }
    })

    it('should work across different tenant keys', () => {
      const tenants = [
        generateEncryptionSalt(),
        generateEncryptionSalt(),
        generateEncryptionSalt()
      ]

      const plaintext = Buffer.from('Shared secret data')

      for (const salt of tenants) {
        const key = deriveTenantKey(salt)
        const encrypted = encryptData(plaintext, key)
        const decrypted = decryptData(encrypted, key)

        expect(decrypted.toString()).toBe('Shared secret data')
      }
    })
  })
})
