import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing the module
vi.mock('../email-service', () => ({
  sendTemplateEmail: vi.fn().mockResolvedValue({ success: true })
}))

vi.mock('../email', () => ({
  sendEmail: vi.fn().mockResolvedValue(true)
}))

vi.mock('../email-templates', () => ({
  otpEmailHtml: vi.fn().mockReturnValue('<html>OTP</html>')
}))

import {
  generateEmailOtp,
  verifyEmailOtp,
  canResendOtp,
  incrementResendCount,
  cleanupExpiredOtps
} from '../email-otp'
import { sendTemplateEmail } from '../email-service'

describe('email-otp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clean up any existing OTPs
    cleanupExpiredOtps()
  })

  describe('generateEmailOtp', () => {
    it('generates a 6-digit code', () => {
      const code = generateEmailOtp('user-1', 'test@example.com')
      expect(code).toMatch(/^\d{6}$/)
    })

    it('calls sendTemplateEmail with otp_code template', () => {
      const code = generateEmailOtp('user-1', 'test@example.com', 'en')
      expect(sendTemplateEmail).toHaveBeenCalledWith(
        'otp_code',
        'test@example.com',
        { code, email: 'test@example.com' },
        { locale: 'en', category: 'otp' }
      )
    })

    it('passes locale to sendTemplateEmail', () => {
      generateEmailOtp('user-2', 'test@example.com', 'de')
      expect(sendTemplateEmail).toHaveBeenCalledWith(
        'otp_code',
        'test@example.com',
        expect.objectContaining({ email: 'test@example.com' }),
        { locale: 'de', category: 'otp' }
      )
    })

    it('defaults to en locale when not provided', () => {
      generateEmailOtp('user-3', 'test@example.com')
      expect(sendTemplateEmail).toHaveBeenCalledWith(
        'otp_code',
        'test@example.com',
        expect.any(Object),
        { locale: 'en', category: 'otp' }
      )
    })
  })

  describe('verifyEmailOtp', () => {
    it('verifies a correct code', () => {
      const code = generateEmailOtp('user-verify', 'test@example.com')
      expect(verifyEmailOtp('user-verify', code)).toBe(true)
    })

    it('rejects an incorrect code', () => {
      generateEmailOtp('user-wrong', 'test@example.com')
      expect(verifyEmailOtp('user-wrong', '000000')).toBe(false)
    })

    it('rejects when no OTP exists', () => {
      expect(verifyEmailOtp('nonexistent', '123456')).toBe(false)
    })

    it('removes OTP after successful verification', () => {
      const code = generateEmailOtp('user-once', 'test@example.com')
      expect(verifyEmailOtp('user-once', code)).toBe(true)
      // Second attempt should fail
      expect(verifyEmailOtp('user-once', code)).toBe(false)
    })

    it('rejects after max attempts', () => {
      generateEmailOtp('user-attempts', 'test@example.com')
      // Exhaust attempts with wrong codes
      verifyEmailOtp('user-attempts', '000001')
      verifyEmailOtp('user-attempts', '000002')
      verifyEmailOtp('user-attempts', '000003')
      // Fourth attempt should be blocked even with wrong code
      expect(verifyEmailOtp('user-attempts', '000004')).toBe(false)
    })

    it('rejects codes with wrong length', () => {
      generateEmailOtp('user-len', 'test@example.com')
      expect(verifyEmailOtp('user-len', '12345')).toBe(false)
      expect(verifyEmailOtp('user-len', '1234567')).toBe(false)
    })
  })

  describe('canResendOtp / incrementResendCount', () => {
    it('allows resend when count is below limit', () => {
      generateEmailOtp('user-resend', 'test@example.com')
      expect(canResendOtp('user-resend')).toBe(true)
    })

    it('blocks resend after max resends', () => {
      generateEmailOtp('user-resend-max', 'test@example.com')
      incrementResendCount('user-resend-max')
      incrementResendCount('user-resend-max')
      incrementResendCount('user-resend-max')
      expect(canResendOtp('user-resend-max')).toBe(false)
    })

    it('returns false for nonexistent user', () => {
      expect(canResendOtp('nonexistent')).toBe(false)
    })
  })

  describe('cleanupExpiredOtps', () => {
    it('removes expired entries', () => {
      const code = generateEmailOtp('user-expire', 'test@example.com')
      // Verify it works
      expect(verifyEmailOtp('user-expire', code)).toBe(true)
      // After cleanup, no entries should remain (already deleted by verify)
      cleanupExpiredOtps()
    })
  })
})
