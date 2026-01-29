import type { GuestEntry, CreateGuestEntryInput, GuestEntriesResponse, GuestEntryResponse } from '~/types/guest'

export function useGuests() {
  const entries = useState<GuestEntry[]>('guest-entries', () => [])
  const isLoading = useState('guests-loading', () => false)
  const error = useState<string | null>('guests-error', () => null)

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
