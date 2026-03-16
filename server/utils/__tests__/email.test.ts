import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('email utilities', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('sendEmail', () => {
    it('should log to console when no RESEND_API_KEY (dev mode)', async () => {
      delete process.env.RESEND_API_KEY
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const { sendEmail } = await import('../email')
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>'
      })

      expect(result).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('test@example.com'))
    })

    it('should call Resend API with correct payload when key is set', async () => {
      process.env.RESEND_API_KEY = 'test-api-key'
      const mockFetch = vi.fn().mockResolvedValue({ ok: true })
      vi.stubGlobal('fetch', mockFetch)

      const { sendEmail } = await import('../email')
      const result = await sendEmail({
        to: 'user@test.com',
        subject: 'Hello',
        html: '<p>World</p>'
      })

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          }),
          body: expect.stringContaining('"to":["user@test.com"]')
        })
      )

      vi.unstubAllGlobals()
    })

    it('should return false on API error', async () => {
      process.env.RESEND_API_KEY = 'test-api-key'
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request')
      }))
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const { sendEmail } = await import('../email')
      const result = await sendEmail({
        to: 'user@test.com',
        subject: 'Test',
        html: '<p>Test</p>'
      })

      expect(result).toBe(false)
      vi.unstubAllGlobals()
    })

    it('should return false on network error', async () => {
      process.env.RESEND_API_KEY = 'test-api-key'
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const { sendEmail } = await import('../email')
      const result = await sendEmail({
        to: 'user@test.com',
        subject: 'Test',
        html: '<p>Test</p>'
      })

      expect(result).toBe(false)
      vi.unstubAllGlobals()
    })

    it('should invoke send hook on success', async () => {
      delete process.env.RESEND_API_KEY
      vi.spyOn(console, 'log').mockImplementation(() => {})

      const { sendEmail, registerEmailSendHook } = await import('../email')
      const hookFn = vi.fn()
      registerEmailSendHook(hookFn)

      await sendEmail({ to: 'test@test.com', subject: 'S', html: '<p>H</p>', source: 'test' })

      expect(hookFn).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'test@test.com', success: true, source: 'test' })
      )
    })

    it('should invoke send hook on failure with error', async () => {
      process.env.RESEND_API_KEY = 'key'
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Fail')))
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const { sendEmail, registerEmailSendHook } = await import('../email')
      const hookFn = vi.fn()
      registerEmailSendHook(hookFn)

      await sendEmail({ to: 'test@test.com', subject: 'S', html: '<p>H</p>' })

      expect(hookFn).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Fail' })
      )
      vi.unstubAllGlobals()
    })
  })

  describe('sendBetaInviteEmail', () => {
    it('should construct HTML with registration URL', async () => {
      delete process.env.RESEND_API_KEY
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const { sendBetaInviteEmail } = await import('../email')
      const result = await sendBetaInviteEmail({
        to: 'user@test.com',
        token: 'abc123',
        expiresAt: new Date('2025-12-31'),
        isFounder: false
      })

      expect(result).toBe(true)
      // Check that the registration URL was included in the logged HTML
      const htmlLog = consoleSpy.mock.calls.find(c => String(c[0]).includes('Body:'))
      expect(htmlLog).toBeDefined()
      expect(String(htmlLog![0])).toContain('register?token=abc123')
    })

    it('should include founder badge when isFounder', async () => {
      delete process.env.RESEND_API_KEY
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const { sendBetaInviteEmail } = await import('../email')
      await sendBetaInviteEmail({
        to: 'user@test.com',
        token: 'abc123',
        expiresAt: new Date('2025-12-31'),
        isFounder: true
      })

      const htmlLog = consoleSpy.mock.calls.find(c => String(c[0]).includes('Body:'))
      expect(String(htmlLog![0])).toContain('FOUNDER')
    })
  })
})
