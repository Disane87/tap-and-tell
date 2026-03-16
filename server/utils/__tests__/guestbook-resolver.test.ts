import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('guestbook-resolver', () => {
  let resolveTenantFromGuestbook: typeof import('../guestbook-resolver').resolveTenantFromGuestbook
  let resolveGuestbook: typeof import('../guestbook-resolver').resolveGuestbook
  let mockDb: Record<string, ReturnType<typeof vi.fn>>

  beforeEach(async () => {
    vi.resetModules()

    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([])
    }

    // guestbook-resolver.ts uses relative import: `import { useDrizzle } from './drizzle'`
    // We must mock it with the relative path from test perspective
    vi.doMock('../drizzle', () => ({
      useDrizzle: () => mockDb
    }))
    vi.doMock('~~/server/database/schema', () => ({
      guestbooks: { id: 'id', tenantId: 'tenantId' }
    }))
    vi.doMock('drizzle-orm', () => ({
      eq: vi.fn()
    }))

    const mod = await import('../guestbook-resolver')
    resolveTenantFromGuestbook = mod.resolveTenantFromGuestbook
    resolveGuestbook = mod.resolveGuestbook
  })

  afterEach(() => {
    vi.doUnmock('../drizzle')
    vi.doUnmock('~~/server/database/schema')
    vi.doUnmock('drizzle-orm')
  })

  describe('resolveTenantFromGuestbook', () => {
    it('should return tenant ID when guestbook found', async () => {
      mockDb.limit.mockResolvedValue([{ tenantId: 'tenant-123' }])
      const result = await resolveTenantFromGuestbook('gb-1')
      expect(result).toBe('tenant-123')
    })

    it('should return null when guestbook not found', async () => {
      mockDb.limit.mockResolvedValue([])
      const result = await resolveTenantFromGuestbook('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('resolveGuestbook', () => {
    it('should return full guestbook object when found', async () => {
      const mockGb = { id: 'gb-1', tenantId: 'tenant-123', name: 'Test Guestbook', type: 'permanent' }
      mockDb.limit.mockResolvedValue([mockGb])
      const result = await resolveGuestbook('gb-1')
      expect(result).toEqual(mockGb)
    })

    it('should return null when not found', async () => {
      mockDb.limit.mockResolvedValue([])
      const result = await resolveGuestbook('nonexistent')
      expect(result).toBeNull()
    })
  })
})
