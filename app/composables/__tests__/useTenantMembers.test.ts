import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, computed, readonly } from 'vue'
import type { TenantMemberWithUser } from '~/types/tenant'

/**
 * Mock $fetch for API calls
 */
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

/**
 * Mock Vue auto-imports for Nuxt
 */
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('readonly', readonly)

/**
 * Mock onUnmounted lifecycle hook (not used by this composable, but stub for safety)
 */
vi.stubGlobal('onUnmounted', vi.fn())

// Import after mocks
import { useTenantMembers } from '../useTenantMembers'

/**
 * Unit tests for useTenantMembers composable.
 * Tests member management operations: fetch, invite, remove.
 * State is instance-scoped (not module-level).
 */
describe('useTenantMembers', () => {
  const mockMember: TenantMemberWithUser = {
    id: 'member-1',
    tenantId: 'tenant-123',
    userId: 'user-1',
    role: 'owner',
    invitedBy: null,
    createdAt: '2024-01-01T00:00:00Z',
    user: {
      id: 'user-1',
      email: 'owner@example.com',
      name: 'Owner'
    }
  }

  const mockMember2: TenantMemberWithUser = {
    id: 'member-2',
    tenantId: 'tenant-123',
    userId: 'user-2',
    role: 'co_owner',
    invitedBy: 'user-1',
    createdAt: '2024-01-15T00:00:00Z',
    user: {
      id: 'user-2',
      email: 'coowner@example.com',
      name: 'Co-Owner'
    }
  }

  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should accept a ref tenant ID', () => {
      const tenantId = ref('tenant-123')
      const { members, loading } = useTenantMembers(tenantId)
      expect(members.value).toEqual([])
      expect(loading.value).toBe(false)
    })

    it('should accept a computed tenant ID', () => {
      const tenantId = computed(() => 'tenant-123')
      const { members, loading } = useTenantMembers(tenantId)
      expect(members.value).toEqual([])
      expect(loading.value).toBe(false)
    })
  })

  describe('fetchMembers', () => {
    it('should fetch and store members on success', async () => {
      const mockMembers = [mockMember, mockMember2]
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: mockMembers
      })

      const tenantId = computed(() => 'tenant-123')
      const { members, fetchMembers } = useTenantMembers(tenantId)
      await fetchMembers()

      expect(mockFetch).toHaveBeenCalledWith('/api/tenants/tenant-123/members')
      expect(members.value).toEqual(mockMembers)
    })

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: unknown) => void
      mockFetch.mockReturnValueOnce(
        new Promise(resolve => { resolvePromise = resolve })
      )

      const tenantId = computed(() => 'tenant-123')
      const { loading, fetchMembers } = useTenantMembers(tenantId)

      const fetchPromise = fetchMembers()
      expect(loading.value).toBe(true)

      resolvePromise!({ success: true, data: [] })
      await fetchPromise

      expect(loading.value).toBe(false)
    })

    it('should clear members on fetch error', async () => {
      // First populate
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: [mockMember]
      })
      const tenantId = computed(() => 'tenant-123')
      const { members, fetchMembers } = useTenantMembers(tenantId)
      await fetchMembers()
      expect(members.value).toHaveLength(1)

      // Now error
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      await fetchMembers()

      expect(members.value).toEqual([])
    })

    it('should reset loading to false after fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Unauthorized'))

      const tenantId = computed(() => 'tenant-123')
      const { loading, fetchMembers } = useTenantMembers(tenantId)
      await fetchMembers()

      expect(loading.value).toBe(false)
    })

    it('should not update members when response has success but no data', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true
        // data is missing
      })

      const tenantId = computed(() => 'tenant-123')
      const { members, fetchMembers } = useTenantMembers(tenantId)
      await fetchMembers()

      expect(members.value).toEqual([])
    })

    it('should not update members when response success is false', async () => {
      mockFetch.mockResolvedValueOnce({
        success: false,
        data: [mockMember]
      })

      const tenantId = computed(() => 'tenant-123')
      const { members, fetchMembers } = useTenantMembers(tenantId)
      await fetchMembers()

      expect(members.value).toEqual([])
    })
  })

  describe('inviteMember', () => {
    it('should invite member and return token + userExists on success', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: { token: 'invite-token-abc' },
        userExists: true
      })

      const tenantId = computed(() => 'tenant-123')
      const { inviteMember } = useTenantMembers(tenantId)
      const result = await inviteMember('newuser@example.com')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-123/members/invite',
        { method: 'POST', body: { email: 'newuser@example.com' } }
      )
      expect(result).toEqual({ token: 'invite-token-abc', userExists: true })
    })

    it('should return userExists false for unregistered users', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: { token: 'invite-token-xyz' },
        userExists: false
      })

      const tenantId = computed(() => 'tenant-123')
      const { inviteMember } = useTenantMembers(tenantId)
      const result = await inviteMember('unregistered@example.com')

      expect(result).toEqual({ token: 'invite-token-xyz', userExists: false })
    })

    it('should default userExists to true when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: { token: 'invite-token-abc' }
        // userExists not in response
      })

      const tenantId = computed(() => 'tenant-123')
      const { inviteMember } = useTenantMembers(tenantId)
      const result = await inviteMember('user@example.com')

      expect(result).toEqual({ token: 'invite-token-abc', userExists: true })
    })

    it('should return null on invite error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Already a member'))

      const tenantId = computed(() => 'tenant-123')
      const { inviteMember } = useTenantMembers(tenantId)
      const result = await inviteMember('existing@example.com')

      expect(result).toBeNull()
    })

    it('should return null on unsuccessful response', async () => {
      mockFetch.mockResolvedValueOnce({
        success: false
      })

      const tenantId = computed(() => 'tenant-123')
      const { inviteMember } = useTenantMembers(tenantId)
      const result = await inviteMember('test@example.com')

      expect(result).toBeNull()
    })

    it('should return null when response has success but no data', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true
        // data is missing
      })

      const tenantId = computed(() => 'tenant-123')
      const { inviteMember } = useTenantMembers(tenantId)
      const result = await inviteMember('test@example.com')

      expect(result).toBeNull()
    })
  })

  describe('removeMember', () => {
    it('should remove member and update local list on success', async () => {
      // First populate the list
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: [mockMember, mockMember2]
      })
      const tenantId = computed(() => 'tenant-123')
      const { members, fetchMembers, removeMember } = useTenantMembers(tenantId)
      await fetchMembers()
      expect(members.value).toHaveLength(2)

      // Remove co-owner
      mockFetch.mockResolvedValueOnce({})
      const result = await removeMember('user-2')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-123/members/user-2',
        { method: 'DELETE' }
      )
      expect(result).toBe(true)
      expect(members.value).toHaveLength(1)
      expect(members.value[0].userId).toBe('user-1')
    })

    it('should return false on remove error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Cannot remove owner'))

      const tenantId = computed(() => 'tenant-123')
      const { removeMember } = useTenantMembers(tenantId)
      const result = await removeMember('user-1')

      expect(result).toBe(false)
    })

    it('should not modify list when removal fails', async () => {
      // First populate the list
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: [mockMember, mockMember2]
      })
      const tenantId = computed(() => 'tenant-123')
      const { members, fetchMembers, removeMember } = useTenantMembers(tenantId)
      await fetchMembers()

      // Fail to remove
      mockFetch.mockRejectedValueOnce(new Error('Server error'))
      await removeMember('user-2')

      expect(members.value).toHaveLength(2)
    })
  })

  describe('instance-scoped state', () => {
    it('should have separate state per instance', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: [mockMember]
      })

      const tenantId1 = computed(() => 'tenant-123')
      const instance1 = useTenantMembers(tenantId1)
      await instance1.fetchMembers()

      const tenantId2 = computed(() => 'tenant-456')
      const instance2 = useTenantMembers(tenantId2)

      // Instance 2 should have its own empty state
      expect(instance1.members.value).toHaveLength(1)
      expect(instance2.members.value).toHaveLength(0)
    })
  })

  describe('reactive tenant ID', () => {
    it('should use updated tenant ID in API calls', async () => {
      const tenantId = ref('tenant-1')
      mockFetch.mockResolvedValue({ success: true, data: [] })

      const { fetchMembers } = useTenantMembers(tenantId)

      await fetchMembers()
      expect(mockFetch).toHaveBeenCalledWith('/api/tenants/tenant-1/members')

      tenantId.value = 'tenant-2'
      await fetchMembers()
      expect(mockFetch).toHaveBeenCalledWith('/api/tenants/tenant-2/members')
    })
  })
})
