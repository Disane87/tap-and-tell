import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, isRef, readonly } from 'vue'
import type { Guestbook } from '~/types/guestbook'

/**
 * Mock $fetch for API calls
 */
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

/**
 * Mock Vue auto-imports for Nuxt
 */
vi.stubGlobal('isRef', isRef)
vi.stubGlobal('ref', ref)
vi.stubGlobal('readonly', readonly)

// Import after mocks
import { useGuestbooks } from '../useGuestbooks'

/**
 * Unit tests for useGuestbooks composable.
 * Tests guestbook CRUD operations within a tenant.
 */
describe('useGuestbooks', () => {
  const mockGuestbook: Guestbook = {
    id: 'gb-123',
    name: 'Test Guestbook',
    tenantId: 'tenant-123',
    type: 'permanent',
    settings: {},
    createdAt: '2024-01-01T00:00:00Z'
  }

  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should accept string tenant ID', () => {
      const { guestbooks, loading, error } = useGuestbooks('tenant-123')
      expect(guestbooks.value).toEqual([])
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('should accept ref tenant ID', () => {
      const tenantId = ref('tenant-456')
      const { guestbooks, loading, error } = useGuestbooks(tenantId)
      expect(guestbooks.value).toEqual([])
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
    })
  })

  describe('fetchGuestbooks', () => {
    it('should fetch and store guestbooks', async () => {
      const mockGuestbooks = [mockGuestbook]
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: mockGuestbooks
      })

      const { guestbooks, fetchGuestbooks } = useGuestbooks('tenant-123')
      await fetchGuestbooks()

      expect(mockFetch).toHaveBeenCalledWith('/api/tenants/tenant-123/guestbooks')
      expect(guestbooks.value).toEqual(mockGuestbooks)
    })

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: unknown) => void
      mockFetch.mockReturnValueOnce(
        new Promise(resolve => { resolvePromise = resolve })
      )

      const { loading, fetchGuestbooks } = useGuestbooks('tenant-123')

      const fetchPromise = fetchGuestbooks()
      expect(loading.value).toBe(true)

      resolvePromise!({ success: true, data: [] })
      await fetchPromise

      expect(loading.value).toBe(false)
    })

    it('should set error on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { error, fetchGuestbooks } = useGuestbooks('tenant-123')
      await fetchGuestbooks()

      expect(error.value).toBe('Network error')
    })

    it('should set error on unsuccessful response', async () => {
      mockFetch.mockResolvedValueOnce({
        success: false,
        error: 'Unauthorized'
      })

      const { error, fetchGuestbooks } = useGuestbooks('tenant-123')
      await fetchGuestbooks()

      expect(error.value).toBe('Failed to fetch guestbooks')
    })
  })

  describe('createGuestbook', () => {
    it('should create guestbook and add to list', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: mockGuestbook
      })

      const { guestbooks, createGuestbook } = useGuestbooks('tenant-123')
      const result = await createGuestbook({
        name: 'Test Guestbook',
        type: 'permanent'
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-123/guestbooks',
        {
          method: 'POST',
          body: { name: 'Test Guestbook', type: 'permanent' }
        }
      )
      expect(result).toEqual(mockGuestbook)
      expect(guestbooks.value).toContainEqual(mockGuestbook)
    })

    it('should return null on creation failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Server error'))

      const { createGuestbook, error } = useGuestbooks('tenant-123')
      const result = await createGuestbook({
        name: 'Test',
        type: 'permanent'
      })

      expect(result).toBeNull()
      expect(error.value).toBe('Server error')
    })
  })

  describe('updateGuestbook', () => {
    it('should update guestbook and modify in list', async () => {
      const updatedGuestbook = { ...mockGuestbook, name: 'Updated Name' }

      mockFetch
        .mockResolvedValueOnce({ success: true, data: [mockGuestbook] }) // fetchGuestbooks
        .mockResolvedValueOnce({ success: true, data: updatedGuestbook }) // updateGuestbook

      const { guestbooks, fetchGuestbooks, updateGuestbook } = useGuestbooks('tenant-123')
      await fetchGuestbooks()

      const result = await updateGuestbook('gb-123', { name: 'Updated Name' })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-123/guestbooks/gb-123',
        {
          method: 'PUT',
          body: { name: 'Updated Name' }
        }
      )
      expect(result).toEqual(updatedGuestbook)
      expect(guestbooks.value[0].name).toBe('Updated Name')
    })

    it('should return null on update failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Not found'))

      const { updateGuestbook } = useGuestbooks('tenant-123')
      const result = await updateGuestbook('gb-123', { name: 'Test' })

      expect(result).toBeNull()
    })
  })

  describe('deleteGuestbook', () => {
    it('should delete guestbook and remove from list', async () => {
      mockFetch
        .mockResolvedValueOnce({ success: true, data: [mockGuestbook] }) // fetchGuestbooks
        .mockResolvedValueOnce({}) // deleteGuestbook

      const { guestbooks, fetchGuestbooks, deleteGuestbook } = useGuestbooks('tenant-123')
      await fetchGuestbooks()
      expect(guestbooks.value).toHaveLength(1)

      const result = await deleteGuestbook('gb-123')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-123/guestbooks/gb-123',
        { method: 'DELETE' }
      )
      expect(result).toBe(true)
      expect(guestbooks.value).toHaveLength(0)
    })

    it('should return false on deletion failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Forbidden'))

      const { deleteGuestbook } = useGuestbooks('tenant-123')
      const result = await deleteGuestbook('gb-123')

      expect(result).toBe(false)
    })
  })

  describe('reactive tenant ID', () => {
    it('should use updated tenant ID in API calls', async () => {
      const tenantId = ref('tenant-1')
      mockFetch.mockResolvedValue({ success: true, data: [] })

      const { fetchGuestbooks } = useGuestbooks(tenantId)

      await fetchGuestbooks()
      expect(mockFetch).toHaveBeenCalledWith('/api/tenants/tenant-1/guestbooks')

      tenantId.value = 'tenant-2'
      await fetchGuestbooks()
      expect(mockFetch).toHaveBeenCalledWith('/api/tenants/tenant-2/guestbooks')
    })
  })
})
