import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, readonly } from 'vue'
import type { GuestEntry } from '~/types/guest'

const mockFetch = vi.fn()

function makeMockEntry(overrides: Partial<GuestEntry> = {}): GuestEntry {
  return {
    id: 'entry-1',
    guestbookId: 'gb-1',
    guestName: 'Alice',
    message: 'Hello!',
    photoUrl: null,
    status: 'approved',
    createdAt: '2025-01-01T00:00:00.000Z',
    answers: [],
    ...overrides,
  } as GuestEntry
}

describe('useGuests', () => {
  let useGuests: typeof import('../useGuests')['useGuests']

  beforeEach(async () => {
    vi.resetModules()
    mockFetch.mockReset()
    vi.stubGlobal('$fetch', mockFetch)
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('readonly', readonly)

    const module = await import('../useGuests')
    useGuests = module.useGuests
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ── Return value structure ──────────────────────────────────────────

  describe('return value structure', () => {
    it('returns entries, loading, error as readonly refs and functions', () => {
      const result = useGuests()

      expect(result).toHaveProperty('entries')
      expect(result).toHaveProperty('loading')
      expect(result).toHaveProperty('error')
      expect(result).toHaveProperty('fetchEntries')
      expect(result).toHaveProperty('createEntry')
      expect(result).toHaveProperty('deleteEntry')
      expect(typeof result.fetchEntries).toBe('function')
      expect(typeof result.createEntry).toBe('function')
      expect(typeof result.deleteEntry).toBe('function')
    })

    it('has correct initial state', () => {
      const { entries, loading, error } = useGuests()

      expect(entries.value).toEqual([])
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
    })
  })

  // ── Module-level state sharing ──────────────────────────────────────

  describe('module-level state sharing', () => {
    it('shares state between multiple useGuests() calls', async () => {
      const entry = makeMockEntry()
      mockFetch.mockResolvedValueOnce({ success: true, data: [entry] })

      const instance1 = useGuests()
      const instance2 = useGuests()

      await instance1.fetchEntries()

      expect(instance1.entries.value).toEqual([entry])
      expect(instance2.entries.value).toEqual([entry])
    })
  })

  // ── fetchEntries ────────────────────────────────────────────────────

  describe('fetchEntries', () => {
    it('fetches entries successfully', async () => {
      const entries = [makeMockEntry({ id: 'e1' }), makeMockEntry({ id: 'e2' })]
      mockFetch.mockResolvedValueOnce({ success: true, data: entries })

      const { entries: result, error, fetchEntries } = useGuests()
      await fetchEntries()

      expect(mockFetch).toHaveBeenCalledWith('/api/entries')
      expect(result.value).toEqual(entries)
      expect(error.value).toBeNull()
    })

    it('sets loading to true during fetch and false after', async () => {
      const loadingStates: boolean[] = []
      mockFetch.mockImplementation(() => {
        // Capture loading state while fetch is in progress
        const { loading } = useGuests()
        loadingStates.push(loading.value)
        return Promise.resolve({ success: true, data: [] })
      })

      const { loading, fetchEntries } = useGuests()
      expect(loading.value).toBe(false)

      await fetchEntries()

      expect(loadingStates[0]).toBe(true)
      expect(loading.value).toBe(false)
    })

    it('handles API error response (success: false)', async () => {
      mockFetch.mockResolvedValueOnce({ success: false, error: 'Unauthorized' })

      const { entries: result, error, fetchEntries } = useGuests()
      await fetchEntries()

      expect(result.value).toEqual([])
      expect(error.value).toBe('Unauthorized')
    })

    it('uses fallback error message when API error is missing', async () => {
      mockFetch.mockResolvedValueOnce({ success: false })

      const { error, fetchEntries } = useGuests()
      await fetchEntries()

      expect(error.value).toBe('Failed to fetch entries')
    })

    it('handles network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { error, fetchEntries } = useGuests()
      await fetchEntries()

      expect(error.value).toBe('Network error')
    })

    it('handles non-Error thrown values', async () => {
      mockFetch.mockRejectedValueOnce('some string error')

      const { error, fetchEntries } = useGuests()
      await fetchEntries()

      expect(error.value).toBe('Failed to fetch entries')
    })

    it('clears previous error on new fetch', async () => {
      mockFetch.mockRejectedValueOnce(new Error('First error'))

      const { error, fetchEntries } = useGuests()
      await fetchEntries()
      expect(error.value).toBe('First error')

      mockFetch.mockResolvedValueOnce({ success: true, data: [] })
      await fetchEntries()
      expect(error.value).toBeNull()
    })

    it('replaces existing entries on successful fetch', async () => {
      const firstBatch = [makeMockEntry({ id: 'e1' })]
      const secondBatch = [makeMockEntry({ id: 'e2' }), makeMockEntry({ id: 'e3' })]
      mockFetch.mockResolvedValueOnce({ success: true, data: firstBatch })

      const { entries: result, fetchEntries } = useGuests()
      await fetchEntries()
      expect(result.value).toEqual(firstBatch)

      mockFetch.mockResolvedValueOnce({ success: true, data: secondBatch })
      await fetchEntries()
      expect(result.value).toEqual(secondBatch)
    })

    it('sets loading to false even when an error occurs', async () => {
      mockFetch.mockRejectedValueOnce(new Error('fail'))

      const { loading, fetchEntries } = useGuests()
      await fetchEntries()

      expect(loading.value).toBe(false)
    })
  })

  // ── createEntry ─────────────────────────────────────────────────────

  describe('createEntry', () => {
    it('creates an entry and unshifts it to the front', async () => {
      const existing = makeMockEntry({ id: 'old' })
      const created = makeMockEntry({ id: 'new', guestName: 'Bob' })
      mockFetch
        .mockResolvedValueOnce({ success: true, data: [existing] })
        .mockResolvedValueOnce({ success: true, data: created })

      const { entries: result, fetchEntries, createEntry } = useGuests()

      await fetchEntries()
      expect(result.value).toHaveLength(1)

      const returned = await createEntry({ guestName: 'Bob', message: 'Hi' } as any)

      expect(mockFetch).toHaveBeenLastCalledWith('/api/entries', {
        method: 'POST',
        body: { guestName: 'Bob', message: 'Hi' },
      })
      expect(returned).toEqual(created)
      expect(result.value).toHaveLength(2)
      expect(result.value[0]).toEqual(created)
    })

    it('returns the created entry on success', async () => {
      const entry = makeMockEntry({ id: 'new-entry' })
      mockFetch.mockResolvedValueOnce({ success: true, data: entry })

      const { createEntry } = useGuests()
      const result = await createEntry({ guestName: 'Test' } as any)

      expect(result).toEqual(entry)
    })

    it('returns null on API error response', async () => {
      mockFetch.mockResolvedValueOnce({ success: false, error: 'Validation failed' })

      const { error, createEntry } = useGuests()
      const result = await createEntry({ guestName: '' } as any)

      expect(result).toBeNull()
      expect(error.value).toBe('Validation failed')
    })

    it('uses fallback error message when API error is missing', async () => {
      mockFetch.mockResolvedValueOnce({ success: false })

      const { error, createEntry } = useGuests()
      await createEntry({ guestName: '' } as any)

      expect(error.value).toBe('Failed to create entry')
    })

    it('returns null on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Timeout'))

      const { error, createEntry } = useGuests()
      const result = await createEntry({ guestName: 'Test' } as any)

      expect(result).toBeNull()
      expect(error.value).toBe('Timeout')
    })

    it('handles non-Error thrown values', async () => {
      mockFetch.mockRejectedValueOnce(42)

      const { error, createEntry } = useGuests()
      await createEntry({ guestName: 'Test' } as any)

      expect(error.value).toBe('Failed to create entry')
    })

    it('sets loading to true during creation and false after', async () => {
      const loadingStates: boolean[] = []
      mockFetch.mockImplementation(() => {
        const { loading } = useGuests()
        loadingStates.push(loading.value)
        return Promise.resolve({ success: true, data: makeMockEntry() })
      })

      const { loading, createEntry } = useGuests()
      expect(loading.value).toBe(false)

      await createEntry({ guestName: 'Test' } as any)

      expect(loadingStates[0]).toBe(true)
      expect(loading.value).toBe(false)
    })

    it('sets loading to false even when an error occurs', async () => {
      mockFetch.mockRejectedValueOnce(new Error('fail'))

      const { loading, createEntry } = useGuests()
      await createEntry({ guestName: 'Test' } as any)

      expect(loading.value).toBe(false)
    })

    it('does not modify entries array on failure', async () => {
      const existing = makeMockEntry({ id: 'existing' })
      mockFetch.mockResolvedValueOnce({ success: true, data: [existing] })

      const { entries: result, fetchEntries, createEntry } = useGuests()
      await fetchEntries()

      mockFetch.mockRejectedValueOnce(new Error('fail'))
      await createEntry({ guestName: 'Test' } as any)

      expect(result.value).toHaveLength(1)
      expect(result.value[0].id).toBe('existing')
    })
  })

  // ── deleteEntry ─────────────────────────────────────────────────────

  describe('deleteEntry', () => {
    it('deletes entry and removes it from the array', async () => {
      const entries = [makeMockEntry({ id: 'e1' }), makeMockEntry({ id: 'e2' })]
      mockFetch.mockResolvedValueOnce({ success: true, data: entries })

      const { entries: result, fetchEntries, deleteEntry } = useGuests()
      await fetchEntries()
      expect(result.value).toHaveLength(2)

      mockFetch.mockResolvedValueOnce(undefined)
      const success = await deleteEntry('e1')

      expect(mockFetch).toHaveBeenLastCalledWith('/api/entries/e1', { method: 'DELETE' })
      expect(success).toBe(true)
      expect(result.value).toHaveLength(1)
      expect(result.value[0].id).toBe('e2')
    })

    it('returns true on successful deletion', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      const { deleteEntry } = useGuests()
      const result = await deleteEntry('some-id')

      expect(result).toBe(true)
    })

    it('returns false on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Not found'))

      const { deleteEntry } = useGuests()
      const result = await deleteEntry('nonexistent')

      expect(result).toBe(false)
    })

    it('does not modify entries array on failure', async () => {
      const entries = [makeMockEntry({ id: 'e1' })]
      mockFetch.mockResolvedValueOnce({ success: true, data: entries })

      const { entries: result, fetchEntries, deleteEntry } = useGuests()
      await fetchEntries()

      mockFetch.mockRejectedValueOnce(new Error('Server error'))
      await deleteEntry('e1')

      expect(result.value).toHaveLength(1)
    })

    it('handles deleting an ID that is not in the array gracefully', async () => {
      const entries = [makeMockEntry({ id: 'e1' })]
      mockFetch.mockResolvedValueOnce({ success: true, data: entries })

      const { entries: result, fetchEntries, deleteEntry } = useGuests()
      await fetchEntries()

      mockFetch.mockResolvedValueOnce(undefined)
      const success = await deleteEntry('nonexistent-id')

      expect(success).toBe(true)
      expect(result.value).toHaveLength(1)
      expect(result.value[0].id).toBe('e1')
    })
  })
})
