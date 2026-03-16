import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('guestbook utilities', () => {
  let mockDb: Record<string, ReturnType<typeof vi.fn>>

  beforeEach(async () => {
    vi.resetModules()

    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
      innerJoin: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis()
    }

    vi.stubGlobal('useDrizzle', vi.fn(() => mockDb))
    vi.stubGlobal('generateId', vi.fn(() => 'generated-id'))

    vi.doMock('drizzle-orm', () => ({
      eq: vi.fn(),
      and: vi.fn(),
      sql: vi.fn()
    }))
    vi.doMock('~~/server/database/schema', () => ({
      guestbooks: {
        id: 'id', tenantId: 'tenantId', name: 'name', type: 'type',
        settings: 'settings', startDate: 'startDate', endDate: 'endDate',
        createdAt: 'createdAt', updatedAt: 'updatedAt'
      },
      tenants: { id: 'id', name: 'name', ownerId: 'ownerId' },
      entries: { guestbookId: 'guestbookId' }
    }))
    vi.doMock('~~/server/types/guestbook', () => ({}))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.doUnmock('drizzle-orm')
    vi.doUnmock('~~/server/database/schema')
    vi.doUnmock('~~/server/types/guestbook')
  })

  describe('getGuestbookById', () => {
    it('should return guestbook when found', async () => {
      const mockGb = { id: 'gb-1', name: 'Test', type: 'permanent' }
      mockDb.where.mockResolvedValue([mockGb])
      const { getGuestbookById } = await import('../guestbook')
      const result = await getGuestbookById('gb-1')
      expect(result).toEqual(mockGb)
    })

    it('should return undefined when not found', async () => {
      mockDb.where.mockResolvedValue([])
      const { getGuestbookById } = await import('../guestbook')
      const result = await getGuestbookById('nonexistent')
      expect(result).toBeUndefined()
    })
  })

  describe('getGuestbooksByTenant', () => {
    it('should return array of guestbooks', async () => {
      const mockGbs = [
        { id: 'gb-1', name: 'GB 1', entryCount: 5 },
        { id: 'gb-2', name: 'GB 2', entryCount: 0 }
      ]
      mockDb.where.mockResolvedValue(mockGbs)
      const { getGuestbooksByTenant } = await import('../guestbook')
      const result = await getGuestbooksByTenant('tenant-1')
      expect(result).toEqual(mockGbs)
      expect(result).toHaveLength(2)
    })

    it('should return empty array for unknown tenant', async () => {
      mockDb.where.mockResolvedValue([])
      const { getGuestbooksByTenant } = await import('../guestbook')
      const result = await getGuestbooksByTenant('unknown')
      expect(result).toEqual([])
    })
  })

  describe('createGuestbook', () => {
    it('should insert with generated ID and return guestbook', async () => {
      const { createGuestbook } = await import('../guestbook')
      const result = await createGuestbook('tenant-1', { name: 'My Guestbook' })

      expect(result.id).toBe('generated-id')
      expect(result.tenantId).toBe('tenant-1')
      expect(result.name).toBe('My Guestbook')
      expect(result.entryCount).toBe(0)
      expect(mockDb.insert).toHaveBeenCalled()
    })

    it('should default type to permanent', async () => {
      const { createGuestbook } = await import('../guestbook')
      const result = await createGuestbook('tenant-1', { name: 'Test' })
      expect(result.type).toBe('permanent')
    })

    it('should default settings to empty object', async () => {
      const { createGuestbook } = await import('../guestbook')
      const result = await createGuestbook('tenant-1', { name: 'Test' })
      expect(result.settings).toEqual({})
    })

    it('should use provided type and settings', async () => {
      const { createGuestbook } = await import('../guestbook')
      const result = await createGuestbook('tenant-1', {
        name: 'Event GB',
        type: 'event' as const,
        settings: { moderation: true } as Record<string, unknown>
      })
      expect(result.type).toBe('event')
      expect(result.settings).toEqual({ moderation: true })
    })

    it('should handle optional date fields', async () => {
      const { createGuestbook } = await import('../guestbook')
      const result = await createGuestbook('tenant-1', {
        name: 'Event',
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      })
      expect(result.startDate).toBe('2025-01-01')
      expect(result.endDate).toBe('2025-12-31')
    })
  })

  describe('updateGuestbook', () => {
    it('should return undefined for non-existent guestbook', async () => {
      mockDb.where.mockResolvedValue([])
      const { updateGuestbook } = await import('../guestbook')
      const result = await updateGuestbook('nonexistent', { name: 'Updated' })
      expect(result).toBeUndefined()
    })

    it('should update and return updated guestbook', async () => {
      const existing = { id: 'gb-1', name: 'Old', type: 'permanent' }
      const updated = { id: 'gb-1', name: 'New', type: 'permanent' }
      mockDb.where
        .mockResolvedValueOnce([existing]) // first select
        .mockResolvedValueOnce(undefined)   // update
        .mockResolvedValueOnce([updated])   // second select
      mockDb.set.mockReturnValue(mockDb) // for update().set().where() chain

      const { updateGuestbook } = await import('../guestbook')
      const result = await updateGuestbook('gb-1', { name: 'New' })
      expect(result).toEqual(updated)
    })
  })

  describe('deleteGuestbook', () => {
    it('should delete and return true', async () => {
      mockDb.where.mockResolvedValue(undefined)
      const { deleteGuestbook } = await import('../guestbook')
      const result = await deleteGuestbook('gb-1')
      expect(result).toBe(true)
      expect(mockDb.delete).toHaveBeenCalled()
    })
  })

  describe('getGuestbookWithTenant', () => {
    it('should return joined data', async () => {
      const mockRow = {
        id: 'gb-1', tenantId: 'tenant-1', name: 'GB', type: 'permanent',
        tenantName: 'Tenant', tenantOwnerId: 'user-1'
      }
      mockDb.where.mockResolvedValue([mockRow])
      const { getGuestbookWithTenant } = await import('../guestbook')
      const result = await getGuestbookWithTenant('gb-1')
      expect(result).toEqual(mockRow)
    })

    it('should return undefined when not found', async () => {
      mockDb.where.mockResolvedValue([])
      const { getGuestbookWithTenant } = await import('../guestbook')
      const result = await getGuestbookWithTenant('nonexistent')
      expect(result).toBeUndefined()
    })
  })
})
