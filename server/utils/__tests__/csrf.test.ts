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
})
