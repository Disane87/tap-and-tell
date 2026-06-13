/**
 * Simplified guestbook composable for public guest operations.
 * Uses the new /api/g/[id] endpoints.
 */
import type { Ref } from 'vue'
import type { GuestEntry, CreateGuestEntryInput } from '~/types/guest'

const entries = ref<GuestEntry[]>([])
const loading = ref(false)

/**
 * Public guest operations for a guestbook.
 * @param guestbookId - Computed or ref guestbook ID
 */
export function useGuestbook(guestbookId: Ref<string> | string) {
  const id = typeof guestbookId === 'string' ? ref(guestbookId) : guestbookId

  /**
   * Fetches approved entries for the guestbook.
   */
  async function fetchEntries(): Promise<void> {
    if (!id.value) return

    loading.value = true
    try {
      const response = await $fetch<{ success: boolean; data?: GuestEntry[] }>(
        `/api/g/${id.value}/entries`
      )
      if (response.success && response.data) {
        entries.value = response.data
      }
    } catch (error) {
      console.error('Failed to fetch entries:', error)
      entries.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Creates a new guest entry.
   */
  async function createEntry(data: CreateGuestEntryInput): Promise<GuestEntry | null> {
    if (!id.value) return null

    try {
      const response = await $fetch<{ success: boolean; data?: GuestEntry }>(
        `/api/g/${id.value}/entries`,
        {
          method: 'POST',
          body: data
        }
      )

      if (response.success && response.data) {
        // Add to local list if auto-approved
        if (response.data.status === 'approved') {
          entries.value.unshift(response.data)
        }
        return response.data
      }

      return null
    } catch (error) {
      console.error('Failed to create entry:', error)
      return null
    }
  }

  return {
    entries,
    loading,
    fetchEntries,
    createEntry
  }
}
