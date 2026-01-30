import type { GuestEntry, CreateGuestEntryInput, GuestEntriesResponse, GuestEntryResponse } from '~/types/guest'

/**
 * Module-level state for guest entries.
 * Shared across all components without SSR serialization issues.
 */
const entries = ref<GuestEntry[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

/**
 * Composable for managing guest entries (CRUD operations).
 *
 * Provides reactive state and methods for fetching, creating, and deleting entries.
 * State is shared across all components via module-level refs.
 *
 * @returns Reactive entries array and CRUD methods.
 */
export function useGuests() {
  /**
   * Fetches all guest entries from the API.
   * Updates the shared entries array.
   */
  async function fetchEntries(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<GuestEntriesResponse>('/api/entries')
      if (response.success && response.data) {
        entries.value = response.data
      } else {
        error.value = response.error || 'Failed to fetch entries'
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch entries'
    } finally {
      loading.value = false
    }
  }

  /**
   * Creates a new guest entry.
   * Adds the entry to the start of the array on success.
   *
   * @param input - Entry data including name, message, optional photo and answers.
   * @returns The created entry or null on failure.
   */
  async function createEntry(input: CreateGuestEntryInput): Promise<GuestEntry | null> {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<GuestEntryResponse>('/api/entries', {
        method: 'POST',
        body: input
      })

      if (response.success && response.data) {
        entries.value.unshift(response.data)
        return response.data
      } else {
        error.value = response.error || 'Failed to create entry'
        return null
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create entry'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Deletes a guest entry by ID.
   * Removes the entry from the array on success.
   *
   * @param id - The entry ID to delete.
   * @returns True if deleted successfully.
   */
  async function deleteEntry(id: string): Promise<boolean> {
    try {
      await $fetch(`/api/entries/${id}`, { method: 'DELETE' })
      entries.value = entries.value.filter(e => e.id !== id)
      return true
    } catch {
      return false
    }
  }

  return {
    entries: readonly(entries),
    loading: readonly(loading),
    error: readonly(error),
    fetchEntries,
    createEntry,
    deleteEntry
  }
}
