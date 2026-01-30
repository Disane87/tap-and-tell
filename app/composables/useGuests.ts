import type { GuestEntry, CreateGuestEntryInput, GuestEntriesResponse, GuestEntryResponse } from '~/types/guest'

/**
 * Composable for managing guest entries (CRUD operations).
 *
 * Provides reactive state for entries, loading, and error, plus
 * `fetchEntries`, `createEntry`, and `deleteEntry` methods that
 * call the `/api/entries` server routes.
 *
 * Uses module-level `ref()` instead of `useState()` to avoid SSR
 * payload serialization and potential hydration mismatches.
 *
 * @returns Reactive guest entries state and mutation functions.
 */

// Module-level refs — NOT useState() — avoids SSR payload serialization
const entries = ref<GuestEntry[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

export function useGuests() {
  /** Fetches all guest entries from the server and updates reactive state. */
  async function fetchEntries(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<GuestEntriesResponse>('/api/entries')

      if (response.success && response.data) {
        entries.value = response.data
      } else {
        throw new Error(response.error || 'Failed to fetch entries')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch entries'
      console.error('Failed to fetch entries:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Creates a new guest entry via `POST /api/entries`.
   * @param input - The guest entry data (name, message, optional photo).
   * @returns The created entry, or `null` if creation failed.
   */
  async function createEntry(input: CreateGuestEntryInput): Promise<GuestEntry | null> {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<GuestEntryResponse>('/api/entries', {
        method: 'POST',
        body: input
      })

      if (response.success && response.data) {
        entries.value = [response.data, ...entries.value]
        return response.data
      } else {
        throw new Error(response.error || 'Failed to create entry')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create entry'
      console.error('Failed to create entry:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Deletes a guest entry by ID via `DELETE /api/entries/:id`.
   * @param id - The entry ID to delete.
   * @returns `true` if deleted successfully, `false` otherwise.
   */
  async function deleteEntry(id: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean }>(`/api/entries/${id}`, {
        method: 'DELETE'
      })

      if (response.success) {
        entries.value = entries.value.filter(e => e.id !== id)
        return true
      } else {
        throw new Error('Failed to delete entry')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete entry'
      console.error('Failed to delete entry:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  return {
    entries: readonly(entries),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchEntries,
    createEntry,
    deleteEntry
  }
}
