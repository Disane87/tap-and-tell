import { describe, it, expect } from 'vitest'
import { validatePasswordPolicy } from '../password-policy'

describe('validatePasswordPolicy', () => {
  it('rejects passwords shorter than 12 characters', () => {
    const result = validatePasswordPolicy('Short1!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must be at least 12 characters long')
  })

  it('rejects passwords without uppercase letters', () => {
    const result = validatePasswordPolicy('lowercase1234!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must contain at least one uppercase letter')
  })

  it('rejects passwords without lowercase letters', () => {
    const result = validatePasswordPolicy('UPPERCASE1234!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must contain at least one lowercase letter')
  })

  it('rejects passwords without digits', () => {
    const result = validatePasswordPolicy('NoDigitsHere!!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must contain at least one digit')
  })

  it('rejects passwords without special characters', () => {
    const result = validatePasswordPolicy('NoSpecial12345')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must contain at least one special character')
  })

  it('rejects common passwords', () => {
    const result = validatePasswordPolicy('password1234')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('This password is too common. Please choose a more unique password')
  })

  it('accepts a strong password', () => {
    const result = validatePasswordPolicy('MyStr0ng!Pass99')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('reports multiple violations at once', () => {
    const result = validatePasswordPolicy('abc')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(1)
  })
})
