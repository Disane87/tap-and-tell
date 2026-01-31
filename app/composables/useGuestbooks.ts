import type { Guestbook, CreateGuestbookInput, UpdateGuestbookInput } from '~/types/guestbook'

/**
 * Composable for guestbook CRUD operations within a tenant.
 *
 * Provides reactive state and methods for managing guestbooks.
 *
 * @param tenantId - The tenant UUID.
 * @returns Reactive guestbooks array and CRUD methods.
 */
export function useGuestbooks(tenantId: Ref<string> | string) {
  const id = isRef(tenantId) ? tenantId : ref(tenantId)
  const guestbooks = ref<Guestbook[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetches all guestbooks for the tenant.
   */
  async function fetchGuestbooks(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; data?: Guestbook[] }>(
        `/api/tenants/${id.value}/guestbooks`
      )
      if (response.success && response.data) {
        guestbooks.value = response.data
      } else {
        error.value = 'Failed to fetch guestbooks'
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch guestbooks'
    } finally {
      loading.value = false
    }
  }

  /**
   * Creates a new guestbook.
   *
   * @param input - Guestbook creation data.
   * @returns The created guestbook or null on failure.
   */
  async function createGuestbook(input: CreateGuestbookInput): Promise<Guestbook | null> {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; data?: Guestbook }>(
        `/api/tenants/${id.value}/guestbooks`,
        {
          method: 'POST',
          body: input
        }
      )
      if (response.success && response.data) {
        guestbooks.value.push(response.data)
        return response.data
      }
      error.value = 'Failed to create guestbook'
      return null
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create guestbook'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Updates an existing guestbook.
   *
   * @param guestbookId - Guestbook ID.
   * @param input - Update data.
   * @returns The updated guestbook or null on failure.
   */
  async function updateGuestbook(guestbookId: string, input: UpdateGuestbookInput): Promise<Guestbook | null> {
    try {
      const response = await $fetch<{ success: boolean; data?: Guestbook }>(
        `/api/tenants/${id.value}/guestbooks/${guestbookId}`,
        {
          method: 'PUT',
          body: input
        }
      )
      if (response.success && response.data) {
        const index = guestbooks.value.findIndex(g => g.id === guestbookId)
        if (index !== -1) {
          guestbooks.value[index] = response.data
        }
        return response.data
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Deletes a guestbook.
   *
   * @param guestbookId - Guestbook ID to delete.
   * @returns True if deleted successfully.
   */
  async function deleteGuestbook(guestbookId: string): Promise<boolean> {
    try {
      await $fetch(`/api/tenants/${id.value}/guestbooks/${guestbookId}`, { method: 'DELETE' })
      guestbooks.value = guestbooks.value.filter(g => g.id !== guestbookId)
      return true
    } catch {
      return false
    }
  }

  return {
    guestbooks: readonly(guestbooks),
    loading: readonly(loading),
    error: readonly(error),
    fetchGuestbooks,
    createGuestbook,
    updateGuestbook,
    deleteGuestbook
  }
}
