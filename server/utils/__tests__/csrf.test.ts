import { describe, it, expect } from 'vitest'
import { generateCsrfToken, validateCsrfToken } from '../csrf'

describe('CSRF', () => {
  it('generates a token in random.signature format', () => {
    const token = generateCsrfToken()
    const parts = token.split('.')
    expect(parts).toHaveLength(2)
    expect(parts[0]!.length).toBe(64) // 32 bytes hex
    expect(parts[1]!.length).toBe(64) // HMAC-SHA256 hex
  })

  it('validates a freshly generated token', () => {
    const token = generateCsrfToken()
    expect(validateCsrfToken(token)).toBe(true)
  })

  it('rejects a tampered token', () => {
    const token = generateCsrfToken()
    const [random] = token.split('.')
    const tampered = `${random}.0000000000000000000000000000000000000000000000000000000000000000`
    expect(validateCsrfToken(tampered)).toBe(false)
  })

  it('rejects empty and invalid input', () => {
    expect(validateCsrfToken('')).toBe(false)
    expect(validateCsrfToken('invalid')).toBe(false)
    expect(validateCsrfToken('a.b.c')).toBe(false)
  })

  it('rejects null and non-string input', () => {
    expect(validateCsrfToken(null as unknown as string)).toBe(false)
    expect(validateCsrfToken(undefined as unknown as string)).toBe(false)
  })

  it('generates unique tokens', () => {
    const t1 = generateCsrfToken()
    const t2 = generateCsrfToken()
    expect(t1).not.toBe(t2)
  })

  it('rejects token with empty random part', () => {
    // Token format ".signature" - empty random part
    expect(validateCsrfToken('.0000000000000000000000000000000000000000000000000000000000000000')).toBe(false)
  })

  it('rejects token with empty signature part', () => {
    // Token format "random." - empty signature part
    expect(validateCsrfToken('0000000000000000000000000000000000000000000000000000000000000000.')).toBe(false)
  })

  it('rejects token with signature of wrong length', () => {
    // Valid random but signature is too short (not 64 hex chars)
    const token = generateCsrfToken()
    const [random] = token.split('.')
    // Use a short signature that won't match the expected HMAC length
    expect(validateCsrfToken(`${random}.abc123`)).toBe(false)
  })

  it('rejects token with signature longer than expected', () => {
    const token = generateCsrfToken()
    const [random] = token.split('.')
    // Use a signature that is longer than 64 hex chars
    const longSignature = '0'.repeat(128)
    expect(validateCsrfToken(`${random}.${longSignature}`)).toBe(false)
  })
})
