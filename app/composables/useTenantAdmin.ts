import type { EntryStatus, GuestEntry, GuestEntriesResponse } from '~/types/guest'

/**
 * Composable for tenant-scoped admin operations.
 *
 * Calls /api/tenants/[uuid]/entries for authenticated owner operations.
 * Uses cookie-based auth instead of Bearer tokens.
 *
 * @param tenantId - The tenant UUID.
 * @returns Admin state and methods.
 */
export function useTenantAdmin(tenantId: Ref<string> | string) {
  const id = isRef(tenantId) ? tenantId : ref(tenantId)

  /**
   * Fetches all entries for a tenant (including pending/rejected).
   *
   * @returns Array of entries or null on failure.
   */
  async function fetchEntries(): Promise<GuestEntry[] | null> {
    try {
      const response = await $fetch<GuestEntriesResponse>(`/api/tenants/${id.value}/entries`)
      if (response.success && response.data) {
        return response.data
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Deletes an entry.
   *
   * @param entryId - The entry ID to delete.
   * @returns True if deletion succeeded.
   */
  async function deleteEntry(entryId: string): Promise<boolean> {
    try {
      await $fetch(`/api/tenants/${id.value}/entries/${entryId}`, { method: 'DELETE' })
      return true
    } catch {
      return false
    }
  }

  /**
   * Updates the moderation status of an entry.
   *
   * @param entryId - The entry ID.
   * @param status - The new status.
   * @param rejectionReason - Optional reason for rejection.
   * @returns The updated entry or null on failure.
   */
  async function updateEntryStatus(
    entryId: string,
    status: EntryStatus,
    rejectionReason?: string
  ): Promise<GuestEntry | null> {
    try {
      const response = await $fetch<{ success: boolean; data?: GuestEntry }>(
        `/api/tenants/${id.value}/entries/${entryId}`,
        {
          method: 'PATCH',
          body: { status, rejectionReason }
        }
      )
      if (response.success && response.data) {
        return response.data
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Bulk updates the moderation status of multiple entries.
   *
   * @param ids - The entry IDs.
   * @param status - The new status.
   * @returns Number of entries updated or -1 on failure.
   */
  async function bulkUpdateStatus(ids: string[], status: EntryStatus): Promise<number> {
    try {
      const response = await $fetch<{ success: boolean; data?: { updated: number } }>(
        `/api/tenants/${id.value}/entries/bulk`,
        {
          method: 'POST',
          body: { ids, status }
        }
      )
      if (response.success && response.data) {
        return response.data.updated
      }
      return -1
    } catch {
      return -1
    }
  }

  return {
    fetchEntries,
    deleteEntry,
    updateEntryStatus,
    bulkUpdateStatus
  }
}
