import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import type { GuestEntry } from '~/types/guest'

/**
 * Mock $fetch for API calls
 */
const mockFetch = vi.fn()

/**
 * Unit tests for useGuestbook composable.
 * Tests public guest operations: fetching entries and creating entries.
 *
 * Uses dynamic imports with vi.resetModules() to ensure module-level
 * refs (entries, loading) are freshly created for each test, and that
 * vi.stubGlobal calls run before the composable module is evaluated.
 */
describe('useGuestbook', () => {
  let useGuestbook: typeof import('../useGuestbook')['useGuestbook']

  const mockEntry: GuestEntry = {
    id: 'entry-1',
    name: 'Alice',
    message: 'Hello!',
    createdAt: '2024-01-01T00:00:00Z',
    status: 'approved'
  }

  const mockEntryPending: GuestEntry = {
    id: 'entry-2',
    name: 'Bob',
    message: 'Pending message',
    createdAt: '2024-01-02T00:00:00Z',
    status: 'pending'
  }

  beforeEach(async () => {
    vi.resetModules()
    mockFetch.mockReset()

    // Stub globals before importing the composable module
    vi.stubGlobal('$fetch', mockFetch)
    vi.stubGlobal('ref', ref)

    const module = await import('../useGuestbook')
    useGuestbook = module.useGuestbook
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should accept a string guestbook ID', () => {
      const { entries, loading } = useGuestbook('gb-123')
      expect(entries.value).toEqual([])
      expect(loading.value).toBe(false)
    })

    it('should accept a ref guestbook ID', () => {
      const guestbookId = ref('gb-456')
      const { entries, loading } = useGuestbook(guestbookId)
      expect(entries.value).toEqual([])
      expect(loading.value).toBe(false)
    })
  })

  describe('fetchEntries', () => {
    it('should fetch and populate entries on success', async () => {
      const mockEntries = [mockEntry]
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: mockEntries
      })

      const { entries, fetchEntries } = useGuestbook('gb-123')
      await fetchEntries()

      expect(mockFetch).toHaveBeenCalledWith('/api/g/gb-123/entries')
      expect(entries.value).toEqual(mockEntries)
    })

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: unknown) => void
      mockFetch.mockReturnValueOnce(
        new Promise(resolve => { resolvePromise = resolve })
      )

      const { loading, fetchEntries } = useGuestbook('gb-123')

      const fetchPromise = fetchEntries()
      expect(loading.value).toBe(true)

      resolvePromise!({ success: true, data: [] })
      await fetchPromise

      expect(loading.value).toBe(false)
    })

    it('should clear entries on fetch error', async () => {
      // First populate entries
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: [mockEntry]
      })

      const { entries, fetchEntries } = useGuestbook('gb-123')
      await fetchEntries()
      expect(entries.value).toHaveLength(1)

      // Now simulate error
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      await fetchEntries()

      expect(entries.value).toEqual([])
    })

    it('should reset loading to false after fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { loading, fetchEntries } = useGuestbook('gb-123')
      await fetchEntries()

      expect(loading.value).toBe(false)
    })

    it('should do nothing when guestbook ID is empty', async () => {
      const { fetchEntries } = useGuestbook('')
      await fetchEntries()

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should do nothing when ref guestbook ID is empty', async () => {
      const guestbookId = ref('')
      const { fetchEntries } = useGuestbook(guestbookId)
      await fetchEntries()

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should not populate entries when response has success but no data', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true
        // data is missing
      })

      const { entries, fetchEntries } = useGuestbook('gb-123')
      await fetchEntries()

      expect(entries.value).toEqual([])
    })

    it('should not populate entries when response success is false', async () => {
      mockFetch.mockResolvedValueOnce({
        success: false,
        data: [mockEntry]
      })

      const { entries, fetchEntries } = useGuestbook('gb-123')
      await fetchEntries()

      expect(entries.value).toEqual([])
    })
  })

  describe('createEntry', () => {
    it('should create entry and return it on success', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: mockEntry
      })

      const { createEntry } = useGuestbook('gb-123')
      const result = await createEntry({ name: 'Alice', message: 'Hello!' })

      expect(mockFetch).toHaveBeenCalledWith('/api/g/gb-123/entries', {
        method: 'POST',
        body: { name: 'Alice', message: 'Hello!' }
      })
      expect(result).toEqual(mockEntry)
    })

    it('should add approved entries to local list', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: mockEntry // status: 'approved'
      })

      const { entries, createEntry } = useGuestbook('gb-123')
      await createEntry({ name: 'Alice', message: 'Hello!' })

      expect(entries.value).toContainEqual(mockEntry)
    })

    it('should prepend approved entries to the beginning of the list', async () => {
      // Pre-populate with existing entry
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: [mockEntry]
      })
      const { entries, fetchEntries, createEntry } = useGuestbook('gb-123')
      await fetchEntries()

      const newEntry: GuestEntry = {
        id: 'entry-3',
        name: 'Charlie',
        message: 'New entry!',
        createdAt: '2024-01-03T00:00:00Z',
        status: 'approved'
      }
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: newEntry
      })

      await createEntry({ name: 'Charlie', message: 'New entry!' })

      expect(entries.value[0]).toEqual(newEntry)
      expect(entries.value).toHaveLength(2)
    })

    it('should not add pending entries to local list', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: mockEntryPending // status: 'pending'
      })

      const { entries, createEntry } = useGuestbook('gb-123')
      const result = await createEntry({ name: 'Bob', message: 'Pending message' })

      expect(result).toEqual(mockEntryPending)
      expect(entries.value).not.toContainEqual(mockEntryPending)
    })

    it('should return null on create error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Server error'))

      const { createEntry } = useGuestbook('gb-123')
      const result = await createEntry({ name: 'Alice', message: 'Hello!' })

      expect(result).toBeNull()
    })

    it('should return null when response success is false', async () => {
      mockFetch.mockResolvedValueOnce({
        success: false
      })

      const { createEntry } = useGuestbook('gb-123')
      const result = await createEntry({ name: 'Alice', message: 'Hello!' })

      expect(result).toBeNull()
    })

    it('should return null when response has success but no data', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true
        // data is missing
      })

      const { createEntry } = useGuestbook('gb-123')
      const result = await createEntry({ name: 'Alice', message: 'Hello!' })

      expect(result).toBeNull()
    })

    it('should return null when guestbook ID is empty', async () => {
      const { createEntry } = useGuestbook('')
      const result = await createEntry({ name: 'Alice', message: 'Hello!' })

      expect(result).toBeNull()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should pass photo and answers in create body', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: mockEntry
      })

      const { createEntry } = useGuestbook('gb-123')
      await createEntry({
        name: 'Alice',
        message: 'Hello!',
        photo: 'base64data',
        answers: { favoriteColor: 'blue' }
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/g/gb-123/entries', {
        method: 'POST',
        body: {
          name: 'Alice',
          message: 'Hello!',
          photo: 'base64data',
          answers: { favoriteColor: 'blue' }
        }
      })
    })
  })

  describe('reactive guestbook ID', () => {
    it('should use updated guestbook ID in API calls', async () => {
      const guestbookId = ref('gb-1')
      mockFetch.mockResolvedValue({ success: true, data: [] })

      const { fetchEntries } = useGuestbook(guestbookId)

      await fetchEntries()
      expect(mockFetch).toHaveBeenCalledWith('/api/g/gb-1/entries')

      guestbookId.value = 'gb-2'
      await fetchEntries()
      expect(mockFetch).toHaveBeenCalledWith('/api/g/gb-2/entries')
    })
  })

  describe('module-level state', () => {
    it('should share entries state across instances', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: [mockEntry]
      })

      const instance1 = useGuestbook('gb-123')
      await instance1.fetchEntries()

      const instance2 = useGuestbook('gb-456')
      // Both instances share the same module-level entries
      expect(instance2.entries.value).toEqual([mockEntry])
    })
  })
})
