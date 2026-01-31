import type { GuestEntry, CreateGuestEntryInput, GuestEntriesResponse, GuestEntryResponse } from '~/types/guest'

/**
 * Composable for guestbook-scoped guest entry CRUD operations.
 *
 * Calls /api/t/[uuid]/g/[gbUuid]/entries for public guest-facing operations.
 * Each call creates fresh state — no module-level sharing needed
 * since each guestbook page is independent.
 *
 * @param tenantId - The tenant UUID.
 * @param guestbookId - The guestbook UUID.
 * @returns Reactive entries array and CRUD methods.
 */
export function useTenantGuests(tenantId: Ref<string> | string, guestbookId: Ref<string> | string) {
  const tId = isRef(tenantId) ? tenantId : ref(tenantId)
  const gbId = isRef(guestbookId) ? guestbookId : ref(guestbookId)
  const entries = ref<GuestEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetches approved entries for the guestbook's public view.
   */
  async function fetchEntries(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<GuestEntriesResponse>(`/api/t/${tId.value}/g/${gbId.value}/entries`)
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
   * Creates a new guest entry for the guestbook.
   *
   * @param input - Entry data.
   * @returns The created entry or null on failure.
   */
  async function createEntry(input: CreateGuestEntryInput): Promise<GuestEntry | null> {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<GuestEntryResponse>(`/api/t/${tId.value}/g/${gbId.value}/entries`, {
        method: 'POST',
        body: input
      })

      if (response.success && response.data) {
        entries.value.unshift(response.data)
        return response.data
      }
      error.value = response.error || 'Failed to create entry'
      return null
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create entry'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    entries: readonly(entries),
    loading: readonly(loading),
    error: readonly(error),
    fetchEntries,
    createEntry
  }
}
