import { describe, it, expect } from 'vitest'
import { generateTotpSecret, generateTotp, verifyTotp, generateTotpUri } from '../totp'

describe('TOTP', () => {
  it('generates a base32 secret', () => {
    const secret = generateTotpSecret()
    expect(secret).toMatch(/^[A-Z2-7]+$/)
    expect(secret.length).toBeGreaterThanOrEqual(16)
  })

  it('generates a 6-digit code', () => {
    const secret = generateTotpSecret()
    const code = generateTotp(secret)
    expect(code).toMatch(/^\d{6}$/)
  })

  it('verifies a correct code', () => {
    const secret = generateTotpSecret()
    const timestamp = Date.now()
    const code = generateTotp(secret, timestamp)
    expect(verifyTotp(secret, code, timestamp)).toBe(true)
  })

  it('rejects an incorrect code', () => {
    const secret = generateTotpSecret()
    expect(verifyTotp(secret, '000000')).toBe(false)
  })

  it('rejects codes with wrong length', () => {
    const secret = generateTotpSecret()
    expect(verifyTotp(secret, '12345')).toBe(false)
    expect(verifyTotp(secret, '1234567')).toBe(false)
    expect(verifyTotp(secret, '')).toBe(false)
  })

  it('generates a valid otpauth URI', () => {
    const secret = generateTotpSecret()
    const uri = generateTotpUri(secret, 'user@example.com')
    expect(uri).toContain('otpauth://totp/')
    expect(uri).toContain(secret)
    expect(uri).toContain('user%40example.com')
    expect(uri).toContain('Tap%20%26%20Tell')
  })

  it('verifies codes within the time window', () => {
    const secret = generateTotpSecret()
    const now = Date.now()
    // Generate code for 30 seconds ago (within ±1 window)
    const pastCode = generateTotp(secret, now - 30_000)
    expect(verifyTotp(secret, pastCode, now)).toBe(true)
  })
})
