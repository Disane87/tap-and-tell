import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick, ref, computed, watch } from 'vue'
import type { GuestEntry } from '~/types/guest'

/**
 * Mock useDebounceFn from VueUse
 */
vi.mock('@vueuse/core', () => ({
  useDebounceFn: (fn: Function) => fn // No debounce in tests
}))

/**
 * Mock Vue auto-imports for Nuxt
 */
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)

// Import after mocks
import { useEntryFilters } from '../useEntryFilters'

/**
 * Unit tests for useEntryFilters composable.
 * Tests entry filtering, sorting, and search functionality.
 */
describe('useEntryFilters', () => {
  const mockEntries: GuestEntry[] = [
    { id: '1', name: 'Alice', message: 'First', createdAt: '2024-01-01T10:00:00Z' },
    { id: '2', name: 'Bob', message: 'Second', createdAt: '2024-01-02T10:00:00Z' },
    { id: '3', name: 'Charlie', message: 'Third', createdAt: '2024-01-03T10:00:00Z' },
    { id: '4', name: 'Alice Smith', message: 'Fourth', createdAt: '2024-01-04T10:00:00Z' }
  ]

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { searchQuery, sortOrder, hasActiveFilters } = useEntryFilters()

      expect(searchQuery.value).toBe('')
      expect(sortOrder.value).toBe('newest')
      expect(hasActiveFilters.value).toBe(false)
    })
  })

  describe('filterEntries', () => {
    it('should return all entries when no filters active', () => {
      const { filterEntries } = useEntryFilters()
      const result = filterEntries(mockEntries)

      expect(result).toHaveLength(4)
    })

    it('should sort by newest first by default', () => {
      const { filterEntries } = useEntryFilters()
      const result = filterEntries(mockEntries)

      expect(result[0].id).toBe('4') // Most recent
      expect(result[3].id).toBe('1') // Oldest
    })

    it('should sort by oldest first when specified', async () => {
      const { filterEntries, sortOrder } = useEntryFilters()
      sortOrder.value = 'oldest'
      await nextTick()

      const result = filterEntries(mockEntries)

      expect(result[0].id).toBe('1') // Oldest
      expect(result[3].id).toBe('4') // Most recent
    })

    it('should filter by search query', async () => {
      const { filterEntries, searchQuery } = useEntryFilters()
      searchQuery.value = 'Alice'
      await nextTick()

      const result = filterEntries(mockEntries)

      expect(result).toHaveLength(2)
      expect(result.every(e => e.name.toLowerCase().includes('alice'))).toBe(true)
    })

    it('should filter case-insensitively', async () => {
      const { filterEntries, searchQuery } = useEntryFilters()
      searchQuery.value = 'ALICE'
      await nextTick()

      const result = filterEntries(mockEntries)

      expect(result).toHaveLength(2)
    })

    it('should handle whitespace in search query', async () => {
      const { filterEntries, searchQuery } = useEntryFilters()
      searchQuery.value = '  Alice  '
      await nextTick()

      const result = filterEntries(mockEntries)

      expect(result).toHaveLength(2)
    })

    it('should return empty array when no matches', async () => {
      const { filterEntries, searchQuery } = useEntryFilters()
      searchQuery.value = 'NonExistent'
      await nextTick()

      const result = filterEntries(mockEntries)

      expect(result).toHaveLength(0)
    })

    it('should combine search and sort', async () => {
      const { filterEntries, searchQuery, sortOrder } = useEntryFilters()
      searchQuery.value = 'Alice'
      sortOrder.value = 'oldest'
      await nextTick()

      const result = filterEntries(mockEntries)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('1') // Older Alice
      expect(result[1].id).toBe('4') // Newer Alice Smith
    })
  })

  describe('clearFilters', () => {
    it('should reset all filters to default', async () => {
      const { searchQuery, sortOrder, clearFilters, hasActiveFilters } = useEntryFilters()

      searchQuery.value = 'Test'
      sortOrder.value = 'oldest'
      await nextTick()

      expect(hasActiveFilters.value).toBe(true)

      clearFilters()
      await nextTick()

      expect(searchQuery.value).toBe('')
      expect(sortOrder.value).toBe('newest')
      expect(hasActiveFilters.value).toBe(false)
    })
  })

  describe('hasActiveFilters', () => {
    it('should be false with default values', () => {
      const { hasActiveFilters } = useEntryFilters()
      expect(hasActiveFilters.value).toBe(false)
    })

    it('should be true when search query is set', async () => {
      const { searchQuery, hasActiveFilters } = useEntryFilters()
      searchQuery.value = 'test'
      await nextTick()

      expect(hasActiveFilters.value).toBe(true)
    })

    it('should be true when sort order is oldest', async () => {
      const { sortOrder, hasActiveFilters } = useEntryFilters()
      sortOrder.value = 'oldest'
      await nextTick()

      expect(hasActiveFilters.value).toBe(true)
    })

    it('should be false after clearing filters', async () => {
      const { searchQuery, sortOrder, clearFilters, hasActiveFilters } = useEntryFilters()

      searchQuery.value = 'test'
      sortOrder.value = 'oldest'
      await nextTick()

      clearFilters()
      await nextTick()

      expect(hasActiveFilters.value).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle empty entries array', () => {
      const { filterEntries } = useEntryFilters()
      const result = filterEntries([])

      expect(result).toHaveLength(0)
    })

    it('should not mutate original array', () => {
      const { filterEntries, sortOrder } = useEntryFilters()
      const original = [...mockEntries]
      sortOrder.value = 'oldest'

      filterEntries(mockEntries)

      expect(mockEntries).toEqual(original)
    })

    it('should handle entries with same date', () => {
      const sameTimeEntries: GuestEntry[] = [
        { id: '1', name: 'First', message: 'A', createdAt: '2024-01-01T10:00:00Z' },
        { id: '2', name: 'Second', message: 'B', createdAt: '2024-01-01T10:00:00Z' }
      ]

      const { filterEntries } = useEntryFilters()
      const result = filterEntries(sameTimeEntries)

      expect(result).toHaveLength(2)
    })
  })
})
