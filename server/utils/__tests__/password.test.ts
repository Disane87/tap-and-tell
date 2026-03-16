import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../password'

describe('password utilities', () => {
  describe('hashPassword', () => {
    it('should return salt:hash format', async () => {
      const result = await hashPassword('testpassword')
      const parts = result.split(':')
      expect(parts).toHaveLength(2)
      expect(parts[0]).toMatch(/^[0-9a-f]{32}$/) // 16 bytes = 32 hex chars
      expect(parts[1]).toMatch(/^[0-9a-f]{128}$/) // 64 bytes = 128 hex chars
    })

    it('should produce different hashes for the same password (unique salt)', async () => {
      const hash1 = await hashPassword('samepassword')
      const hash2 = await hashPassword('samepassword')
      expect(hash1).not.toBe(hash2)
    })

    it('should produce different hashes for different passwords', async () => {
      const hash1 = await hashPassword('password1')
      const hash2 = await hashPassword('password2')
      const derived1 = hash1.split(':')[1]
      const derived2 = hash2.split(':')[1]
      expect(derived1).not.toBe(derived2)
    })

    it('should handle empty string', async () => {
      const result = await hashPassword('')
      const parts = result.split(':')
      expect(parts).toHaveLength(2)
      expect(parts[0].length).toBe(32)
      expect(parts[1].length).toBe(128)
    })

    it('should handle unicode characters', async () => {
      const result = await hashPassword('Pässwörd🔑')
      const parts = result.split(':')
      expect(parts).toHaveLength(2)
      expect(parts[0].length).toBe(32)
      expect(parts[1].length).toBe(128)
    })

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(10000)
      const result = await hashPassword(longPassword)
      expect(result.split(':')).toHaveLength(2)
    })
  })

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const stored = await hashPassword('correctpassword')
      const result = await verifyPassword('correctpassword', stored)
      expect(result).toBe(true)
    })

    it('should return false for wrong password', async () => {
      const stored = await hashPassword('correctpassword')
      const result = await verifyPassword('wrongpassword', stored)
      expect(result).toBe(false)
    })

    it('should return false for malformed stored hash (no colon)', async () => {
      const result = await verifyPassword('password', 'nocolonhere')
      expect(result).toBe(false)
    })

    it('should return false for empty salt', async () => {
      const result = await verifyPassword('password', ':abcdef1234567890')
      expect(result).toBe(false)
    })

    it('should return false for empty hash', async () => {
      const result = await verifyPassword('password', 'abcdef1234567890:')
      expect(result).toBe(false)
    })

    it('should verify unicode passwords', async () => {
      const stored = await hashPassword('Ünïcödé🎉')
      expect(await verifyPassword('Ünïcödé🎉', stored)).toBe(true)
      expect(await verifyPassword('Unicode', stored)).toBe(false)
    })

    it('should round-trip multiple passwords correctly', async () => {
      const passwords = ['short', 'a-medium-length-password', 'Str0ng!P@$$w0rd#2024', '']
      for (const pw of passwords) {
        const stored = await hashPassword(pw)
        expect(await verifyPassword(pw, stored)).toBe(true)
        expect(await verifyPassword(pw + 'x', stored)).toBe(false)
      }
    })
  })
})
