import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('email-service', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.doUnmock('h3')
  })

  describe('registerEmailServiceProvider', () => {
    it('should set provider and delegate sendTemplateEmail', async () => {
      const mockProvider = {
        sendTemplateEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-1' })
      }

      vi.doMock('h3', () => ({
        getRequestHeader: vi.fn()
      }))

      const { registerEmailServiceProvider, sendTemplateEmail } = await import('../email-service')
      registerEmailServiceProvider(mockProvider)

      const result = await sendTemplateEmail('otp_code', 'user@test.com', { code: '123456' })

      expect(result.success).toBe(true)
      expect(mockProvider.sendTemplateEmail).toHaveBeenCalledWith(
        'otp_code', 'user@test.com', { code: '123456' }, undefined
      )
    })
  })

  describe('sendTemplateEmail (fallback)', () => {
    it('should use fallback templates when no provider registered', async () => {
      vi.doMock('h3', () => ({
        getRequestHeader: vi.fn()
      }))

      // We need to mock sendEmail and wrapEmailLayout which are Nitro auto-imports
      vi.stubGlobal('sendEmail', vi.fn().mockResolvedValue(true))
      vi.stubGlobal('wrapEmailLayout', vi.fn((opts: { content: string }) => `<html>${opts.content}</html>`))
      vi.stubGlobal('renderTemplate', vi.fn((template: string, vars: Record<string, string>) => {
        let result = template
        for (const [key, value] of Object.entries(vars)) {
          result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
        }
        return result
      }))

      const mod = await import('../email-service')
      // Ensure no provider is set (fresh module)
      const result = await mod.sendTemplateEmail('otp_code', 'user@test.com', { code: '123456' }, { locale: 'en' })

      expect(result.success).toBe(true)
    })

    it('should return error for unknown template slug', async () => {
      vi.doMock('h3', () => ({
        getRequestHeader: vi.fn()
      }))
      vi.spyOn(console, 'warn').mockImplementation(() => {})

      const mod = await import('../email-service')
      const result = await mod.sendTemplateEmail('nonexistent_template', 'user@test.com', {})

      expect(result.success).toBe(false)
      expect(result.error).toContain('nonexistent_template')
    })
  })

  describe('detectLocaleFromHeader', () => {
    it('should return de for German Accept-Language', async () => {
      vi.doMock('h3', () => ({
        getRequestHeader: vi.fn().mockReturnValue('de-DE,de;q=0.9,en;q=0.8')
      }))

      const { detectLocaleFromHeader } = await import('../email-service')
      const result = detectLocaleFromHeader({} as import('h3').H3Event)
      expect(result).toBe('de')
    })

    it('should return en for English Accept-Language', async () => {
      vi.doMock('h3', () => ({
        getRequestHeader: vi.fn().mockReturnValue('en-US,en;q=0.9')
      }))

      const { detectLocaleFromHeader } = await import('../email-service')
      const result = detectLocaleFromHeader({} as import('h3').H3Event)
      expect(result).toBe('en')
    })

    it('should return en for empty header', async () => {
      vi.doMock('h3', () => ({
        getRequestHeader: vi.fn().mockReturnValue('')
      }))

      const { detectLocaleFromHeader } = await import('../email-service')
      const result = detectLocaleFromHeader({} as import('h3').H3Event)
      expect(result).toBe('en')
    })
  })
})
