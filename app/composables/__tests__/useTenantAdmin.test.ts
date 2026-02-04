import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, isRef } from 'vue'
import type { GuestEntry, EntryStatus } from '~/types/guest'

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

// Import after mocks
import { useTenantAdmin } from '../useTenantAdmin'

/**
 * Unit tests for useTenantAdmin composable.
 * Tests admin operations for guestbook entry moderation.
 */
describe('useTenantAdmin', () => {
  const mockEntry: GuestEntry = {
    id: 'entry-123',
    name: 'Test Guest',
    message: 'Test message',
    createdAt: '2024-01-01T00:00:00Z',
    status: 'pending'
  }

  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchEntries', () => {
    it('should fetch all entries for a guestbook', async () => {
      const mockEntries = [mockEntry]
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: mockEntries
      })

      const { fetchEntries } = useTenantAdmin('tenant-123', 'guestbook-456')
      const result = await fetchEntries()

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-123/guestbooks/guestbook-456/entries'
      )
      expect(result).toEqual(mockEntries)
    })

    it('should return null on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Unauthorized'))

      const { fetchEntries } = useTenantAdmin('tenant-123', 'guestbook-456')
      const result = await fetchEntries()

      expect(result).toBeNull()
    })

    it('should return null on unsuccessful response', async () => {
      mockFetch.mockResolvedValueOnce({
        success: false,
        error: 'Not found'
      })

      const { fetchEntries } = useTenantAdmin('tenant-123', 'guestbook-456')
      const result = await fetchEntries()

      expect(result).toBeNull()
    })
  })

  describe('deleteEntry', () => {
    it('should delete entry successfully', async () => {
      mockFetch.mockResolvedValueOnce({})

      const { deleteEntry } = useTenantAdmin('tenant-123', 'guestbook-456')
      const result = await deleteEntry('entry-123')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-123/guestbooks/guestbook-456/entries/entry-123',
        { method: 'DELETE' }
      )
      expect(result).toBe(true)
    })

    it('should return false on deletion failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Not found'))

      const { deleteEntry } = useTenantAdmin('tenant-123', 'guestbook-456')
      const result = await deleteEntry('entry-123')

      expect(result).toBe(false)
    })
  })

  describe('updateEntryStatus', () => {
    it('should update entry status to approved', async () => {
      const updatedEntry = { ...mockEntry, status: 'approved' as EntryStatus }
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: updatedEntry
      })

      const { updateEntryStatus } = useTenantAdmin('tenant-123', 'guestbook-456')
      const result = await updateEntryStatus('entry-123', 'approved')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-123/guestbooks/guestbook-456/entries/entry-123',
        {
          method: 'PATCH',
          body: { status: 'approved', rejectionReason: undefined }
        }
      )
      expect(result).toEqual(updatedEntry)
    })

    it('should update entry status to rejected with reason', async () => {
      const updatedEntry = {
        ...mockEntry,
        status: 'rejected' as EntryStatus,
        rejectionReason: 'Inappropriate content'
      }
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: updatedEntry
      })

      const { updateEntryStatus } = useTenantAdmin('tenant-123', 'guestbook-456')
      const result = await updateEntryStatus('entry-123', 'rejected', 'Inappropriate content')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-123/guestbooks/guestbook-456/entries/entry-123',
        {
          method: 'PATCH',
          body: { status: 'rejected', rejectionReason: 'Inappropriate content' }
        }
      )
      expect(result).toEqual(updatedEntry)
    })

    it('should return null on update failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Server error'))

      const { updateEntryStatus } = useTenantAdmin('tenant-123', 'guestbook-456')
      const result = await updateEntryStatus('entry-123', 'approved')

      expect(result).toBeNull()
    })
  })

  describe('bulkUpdateStatus', () => {
    it('should bulk update multiple entries', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: { updated: 3 }
      })

      const { bulkUpdateStatus } = useTenantAdmin('tenant-123', 'guestbook-456')
      const result = await bulkUpdateStatus(['entry-1', 'entry-2', 'entry-3'], 'approved')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-123/guestbooks/guestbook-456/entries/bulk',
        {
          method: 'POST',
          body: { ids: ['entry-1', 'entry-2', 'entry-3'], status: 'approved' }
        }
      )
      expect(result).toBe(3)
    })

    it('should return -1 on bulk update failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Server error'))

      const { bulkUpdateStatus } = useTenantAdmin('tenant-123', 'guestbook-456')
      const result = await bulkUpdateStatus(['entry-1', 'entry-2'], 'approved')

      expect(result).toBe(-1)
    })
  })

  describe('bulkDeleteEntries', () => {
    it('should delete multiple entries', async () => {
      mockFetch
        .mockResolvedValueOnce({}) // First delete
        .mockResolvedValueOnce({}) // Second delete
        .mockResolvedValueOnce({}) // Third delete

      const { bulkDeleteEntries } = useTenantAdmin('tenant-123', 'guestbook-456')
      const result = await bulkDeleteEntries(['entry-1', 'entry-2', 'entry-3'])

      expect(result).toBe(3)
    })

    it('should return count of successfully deleted entries', async () => {
      mockFetch
        .mockResolvedValueOnce({}) // First succeeds
        .mockRejectedValueOnce(new Error('Not found')) // Second fails
        .mockResolvedValueOnce({}) // Third succeeds

      const { bulkDeleteEntries } = useTenantAdmin('tenant-123', 'guestbook-456')
      const result = await bulkDeleteEntries(['entry-1', 'entry-2', 'entry-3'])

      expect(result).toBe(2) // Only 2 succeeded
    })
  })

  describe('reactive IDs', () => {
    it('should use updated tenant and guestbook IDs', async () => {
      const tenantId = ref('tenant-1')
      const guestbookId = ref('guestbook-1')

      mockFetch.mockResolvedValue({ success: true, data: [] })

      const { fetchEntries } = useTenantAdmin(tenantId, guestbookId)

      await fetchEntries()
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-1/guestbooks/guestbook-1/entries'
      )

      tenantId.value = 'tenant-2'
      guestbookId.value = 'guestbook-2'

      await fetchEntries()
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-2/guestbooks/guestbook-2/entries'
      )
    })
  })
})
