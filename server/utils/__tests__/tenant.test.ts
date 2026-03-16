import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('tenant utilities', () => {
  let mockDb: Record<string, ReturnType<typeof vi.fn>>

  beforeEach(async () => {
    vi.resetModules()

    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
      limit: vi.fn().mockResolvedValue([]),
      innerJoin: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockReturnThis()
    }

    vi.stubGlobal('useDrizzle', vi.fn(() => mockDb))
    vi.stubGlobal('generateId', vi.fn(() => 'generated-id'))

    vi.doMock('drizzle-orm', () => ({
      eq: vi.fn(),
      and: vi.fn((...args: unknown[]) => args),
      sql: vi.fn()
    }))
    vi.doMock('~~/server/database/schema', () => ({
      tenants: { id: 'id', name: 'name', ownerId: 'ownerId', createdAt: 'createdAt', updatedAt: 'updatedAt' },
      tenantMembers: {
        id: 'id', tenantId: 'tenantId', userId: 'userId',
        role: 'role', invitedBy: 'invitedBy', createdAt: 'createdAt'
      },
      users: { id: 'id', name: 'name', email: 'email' },
      guestbooks: { tenantId: 'tenantId' }
    }))
    vi.doMock('~~/server/types/tenant', () => ({}))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.doUnmock('drizzle-orm')
    vi.doUnmock('~~/server/database/schema')
    vi.doUnmock('~~/server/types/tenant')
  })

  describe('getDefaultTenantId', () => {
    it('should return ID of first tenant', async () => {
      mockDb.limit.mockResolvedValue([{ id: 'tenant-1' }])
      const { getDefaultTenantId } = await import('../tenant')
      const result = await getDefaultTenantId()
      expect(result).toBe('tenant-1')
    })

    it('should return undefined when no tenants', async () => {
      mockDb.limit.mockResolvedValue([])
      const { getDefaultTenantId } = await import('../tenant')
      const result = await getDefaultTenantId()
      expect(result).toBeUndefined()
    })
  })

  describe('getTenantById', () => {
    it('should return tenant when found', async () => {
      const tenant = { id: 'tenant-1', name: 'Test Tenant', ownerId: 'user-1' }
      mockDb.where.mockResolvedValue([tenant])
      const { getTenantById } = await import('../tenant')
      const result = await getTenantById('tenant-1')
      expect(result).toEqual(tenant)
    })

    it('should return undefined when not found', async () => {
      mockDb.where.mockResolvedValue([])
      const { getTenantById } = await import('../tenant')
      const result = await getTenantById('nonexistent')
      expect(result).toBeUndefined()
    })
  })

  describe('getTenantsByOwner', () => {
    it('should return owned tenants', async () => {
      const tenantsList = [
        { id: 'tenant-1', name: 'T1', ownerId: 'user-1' },
        { id: 'tenant-2', name: 'T2', ownerId: 'user-1' }
      ]
      mockDb.where.mockResolvedValue(tenantsList)
      const { getTenantsByOwner } = await import('../tenant')
      const result = await getTenantsByOwner('user-1')
      expect(result).toHaveLength(2)
    })
  })

  describe('verifyTenantOwnership', () => {
    it('should return true for owner', async () => {
      mockDb.where.mockResolvedValue([{ id: 'tenant-1', ownerId: 'user-1' }])
      const { verifyTenantOwnership } = await import('../tenant')
      const result = await verifyTenantOwnership('tenant-1', 'user-1')
      expect(result).toBe(true)
    })

    it('should return false for non-owner', async () => {
      mockDb.where.mockResolvedValue([{ id: 'tenant-1', ownerId: 'user-1' }])
      const { verifyTenantOwnership } = await import('../tenant')
      const result = await verifyTenantOwnership('tenant-1', 'user-other')
      expect(result).toBe(false)
    })

    it('should return false when tenant not found', async () => {
      mockDb.where.mockResolvedValue([])
      const { verifyTenantOwnership } = await import('../tenant')
      const result = await verifyTenantOwnership('nonexistent', 'user-1')
      expect(result).toBe(false)
    })
  })

  describe('getUserTenantRole', () => {
    it('should return role when member', async () => {
      mockDb.where.mockResolvedValue([{ role: 'co_owner' }])
      const { getUserTenantRole } = await import('../tenant')
      const result = await getUserTenantRole('tenant-1', 'user-1')
      expect(result).toBe('co_owner')
    })

    it('should return null when not member', async () => {
      mockDb.where.mockResolvedValue([])
      const { getUserTenantRole } = await import('../tenant')
      const result = await getUserTenantRole('tenant-1', 'user-unknown')
      expect(result).toBeNull()
    })
  })

  describe('canPerformAction', () => {
    // Helper: set up role mock for getUserTenantRole
    const setupRole = (role: string | null) => {
      if (role) {
        mockDb.where.mockResolvedValue([{ role }])
      } else {
        mockDb.where.mockResolvedValue([])
      }
    }

    it('should allow read for owner', async () => {
      setupRole('owner')
      const { canPerformAction } = await import('../tenant')
      expect(await canPerformAction('t1', 'u1', 'read')).toBe(true)
    })

    it('should allow read for co_owner', async () => {
      setupRole('co_owner')
      const { canPerformAction } = await import('../tenant')
      expect(await canPerformAction('t1', 'u1', 'read')).toBe(true)
    })

    it('should allow moderate for owner', async () => {
      setupRole('owner')
      const { canPerformAction } = await import('../tenant')
      expect(await canPerformAction('t1', 'u1', 'moderate')).toBe(true)
    })

    it('should allow moderate for co_owner', async () => {
      setupRole('co_owner')
      const { canPerformAction } = await import('../tenant')
      expect(await canPerformAction('t1', 'u1', 'moderate')).toBe(true)
    })

    it('should allow manage for owner only', async () => {
      setupRole('owner')
      const { canPerformAction } = await import('../tenant')
      expect(await canPerformAction('t1', 'u1', 'manage')).toBe(true)
    })

    it('should deny manage for co_owner', async () => {
      setupRole('co_owner')
      const { canPerformAction } = await import('../tenant')
      expect(await canPerformAction('t1', 'u1', 'manage')).toBe(false)
    })

    it('should allow delete for owner only', async () => {
      setupRole('owner')
      const { canPerformAction } = await import('../tenant')
      expect(await canPerformAction('t1', 'u1', 'delete')).toBe(true)
    })

    it('should deny delete for co_owner', async () => {
      setupRole('co_owner')
      const { canPerformAction } = await import('../tenant')
      expect(await canPerformAction('t1', 'u1', 'delete')).toBe(false)
    })

    it('should return false for non-member', async () => {
      setupRole(null)
      const { canPerformAction } = await import('../tenant')
      expect(await canPerformAction('t1', 'u1', 'read')).toBe(false)
    })
  })

  describe('getTenantMembers', () => {
    it('should return members with user details', async () => {
      mockDb.where.mockResolvedValue([{
        id: 'm1', tenantId: 't1', userId: 'u1', role: 'owner',
        invitedBy: null, createdAt: new Date('2025-01-01'),
        userName: 'Test User', userEmail: 'test@test.com'
      }])
      const { getTenantMembers } = await import('../tenant')
      const result = await getTenantMembers('t1')
      expect(result).toHaveLength(1)
      expect(result[0].user.email).toBe('test@test.com')
      expect(result[0].role).toBe('owner')
    })
  })

  describe('addTenantMember', () => {
    it('should insert member with generated ID', async () => {
      const { addTenantMember } = await import('../tenant')
      await addTenantMember('t1', 'u2', 'co_owner' as 'co_owner', 'u1')
      expect(mockDb.insert).toHaveBeenCalled()
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'generated-id',
          tenantId: 't1',
          userId: 'u2',
          role: 'co_owner',
          invitedBy: 'u1'
        })
      )
    })

    it('should set invitedBy to null when not provided', async () => {
      const { addTenantMember } = await import('../tenant')
      await addTenantMember('t1', 'u2', 'co_owner' as 'co_owner')
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({ invitedBy: null })
      )
    })
  })

  describe('removeTenantMember', () => {
    it('should refuse to remove owner', async () => {
      mockDb.where.mockResolvedValue([{ role: 'owner' }])
      const { removeTenantMember } = await import('../tenant')
      const result = await removeTenantMember('t1', 'u1')
      expect(result).toBe(false)
    })

    it('should remove co_owner and return true', async () => {
      // First call: getUserTenantRole returns co_owner
      // Second call: delete
      mockDb.where
        .mockResolvedValueOnce([{ role: 'co_owner' }])
        .mockResolvedValueOnce(undefined)
      const { removeTenantMember } = await import('../tenant')
      const result = await removeTenantMember('t1', 'u2')
      expect(result).toBe(true)
      expect(mockDb.delete).toHaveBeenCalled()
    })

    it('should return false for non-member', async () => {
      mockDb.where.mockResolvedValue([])
      const { removeTenantMember } = await import('../tenant')
      const result = await removeTenantMember('t1', 'u-unknown')
      expect(result).toBe(false)
    })
  })
})
