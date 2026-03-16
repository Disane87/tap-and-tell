import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('audit utilities', () => {
  let mockDb: Record<string, ReturnType<typeof vi.fn>>

  beforeEach(async () => {
    vi.resetModules()

    mockDb = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined)
    }

    vi.stubGlobal('useDrizzle', vi.fn(() => mockDb))
    vi.stubGlobal('generateId', vi.fn(() => 'audit-id-123'))
    vi.stubGlobal('getRequestIP', vi.fn(() => '192.168.1.1'))
    vi.stubGlobal('getRequestHeader', vi.fn(() => 'Mozilla/5.0 Test Agent'))

    vi.doMock('~~/server/database/schema', () => ({
      auditLogs: { id: 'id' }
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.doUnmock('~~/server/database/schema')
  })

  describe('recordAuditLog', () => {
    it('should insert log with all fields', async () => {
      const { recordAuditLog } = await import('../audit')

      const mockEvent = { context: {} } as import('h3').H3Event
      await recordAuditLog(mockEvent, 'auth.login', {
        tenantId: 'tenant-1',
        userId: 'user-1',
        resourceType: 'session',
        resourceId: 'sess-1',
        details: { method: 'password' }
      })

      expect(mockDb.insert).toHaveBeenCalled()
      expect(mockDb.values).toHaveBeenCalledWith(expect.objectContaining({
        id: 'audit-id-123',
        tenantId: 'tenant-1',
        userId: 'user-1',
        action: 'auth.login',
        resourceType: 'session',
        resourceId: 'sess-1',
        details: { method: 'password' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Agent'
      }))
    })

    it('should use event.context.user.id as fallback userId', async () => {
      const { recordAuditLog } = await import('../audit')

      const mockEvent = { context: { user: { id: 'ctx-user-1' } } } as unknown as import('h3').H3Event
      await recordAuditLog(mockEvent, 'auth.logout')

      expect(mockDb.values).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'ctx-user-1'
      }))
    })

    it('should handle optional fields with null defaults', async () => {
      const { recordAuditLog } = await import('../audit')

      const mockEvent = { context: {} } as import('h3').H3Event
      await recordAuditLog(mockEvent, 'entry.create')

      expect(mockDb.values).toHaveBeenCalledWith(expect.objectContaining({
        tenantId: null,
        userId: null,
        resourceType: null,
        resourceId: null,
        details: null
      }))
    })

    it('should not throw on DB error (silent catch)', async () => {
      mockDb.values.mockRejectedValue(new Error('DB connection failed'))
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const { recordAuditLog } = await import('../audit')
      const mockEvent = { context: {} } as import('h3').H3Event

      await expect(recordAuditLog(mockEvent, 'auth.login')).resolves.toBeUndefined()
    })

    it('should log error to console on failure', async () => {
      mockDb.values.mockRejectedValue(new Error('DB error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { recordAuditLog } = await import('../audit')
      const mockEvent = { context: {} } as import('h3').H3Event

      await recordAuditLog(mockEvent, 'auth.login')
      expect(consoleSpy).toHaveBeenCalledWith(
        '[audit] Failed to record audit log:',
        expect.any(Error)
      )
    })
  })
})
