import { useDebounceFn } from '@vueuse/core'
import type { GuestEntry } from '~/types/guest'

/**
 * Composable for filtering and sorting guest entries.
 *
 * Provides search by name, sort options, and filtered results.
 * Search is debounced to avoid excessive filtering on every keystroke.
 *
 * @returns Filter state and filtered entries computed
 */
export function useEntryFilters() {
  const searchQuery = ref('')
  const sortOrder = ref<'newest' | 'oldest'>('newest')

  /**
   * Debounced search query for performance.
   */
  const debouncedQuery = ref('')
  const updateDebouncedQuery = useDebounceFn((value: string) => {
    debouncedQuery.value = value
  }, 300)

  watch(searchQuery, (value) => {
    updateDebouncedQuery(value)
  })

  /**
   * Filters and sorts entries based on current filter state.
   *
   * @param entries - The raw entries array
   * @returns Filtered and sorted entries
   */
  function filterEntries(entries: GuestEntry[]): GuestEntry[] {
    let result = [...entries]

    // Filter by search query
    if (debouncedQuery.value.trim()) {
      const query = debouncedQuery.value.toLowerCase().trim()
      result = result.filter(entry =>
        entry.name.toLowerCase().includes(query)
      )
    }

    // Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortOrder.value === 'newest' ? dateB - dateA : dateA - dateB
    })

    return result
  }

  /**
   * Clears all filters and resets to default state.
   */
  function clearFilters(): void {
    searchQuery.value = ''
    debouncedQuery.value = ''
    sortOrder.value = 'newest'
  }

  /**
   * Whether any filters are currently active.
   */
  const hasActiveFilters = computed(() =>
    searchQuery.value.trim() !== '' || sortOrder.value !== 'newest'
  )

  return {
    searchQuery,
    sortOrder,
    filterEntries,
    clearFilters,
    hasActiveFilters
  }
}
