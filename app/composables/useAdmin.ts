import type { EntryStatus, GuestEntry, GuestEntriesResponse } from '~/types/guest'

/**
 * Module-level state for admin authentication.
 * Uses plain ref to avoid SSR serialization issues.
 */
const token = ref<string | null>(null)
const isAuthenticated = ref(false)

/**
 * Composable for admin authentication and entry management.
 *
 * Uses sessionStorage to persist the auth token within a browser session.
 * Token is validated server-side on each admin API request.
 *
 * @returns Auth state and methods.
 */
export function useAdmin() {
  /**
   * Initializes auth state from sessionStorage.
   * Should be called once on admin page mount.
   */
  function initAuth(): void {
    if (import.meta.server) return

    const stored = sessionStorage.getItem('admin_token')
    if (stored) {
      token.value = stored
      isAuthenticated.value = true
    }
  }

  /**
   * Attempts to log in with the provided password.
   *
   * @param password - The admin password.
   * @returns True if login succeeded.
   */
  async function login(password: string): Promise<boolean> {
    try {
      const response = await $fetch<{ success: boolean; token?: string }>('/api/admin/login', {
        method: 'POST',
        body: { password }
      })

      if (response.success && response.token) {
        token.value = response.token
        isAuthenticated.value = true
        if (import.meta.client) {
          sessionStorage.setItem('admin_token', response.token)
        }
        return true
      }
      return false
    } catch {
      return false
    }
  }

  /**
   * Logs out by clearing the token.
   */
  function logout(): void {
    token.value = null
    isAuthenticated.value = false
    if (import.meta.client) {
      sessionStorage.removeItem('admin_token')
    }
  }

  /**
   * Fetches all entries with admin authentication.
   *
   * @returns Array of entries or null on failure.
   */
  async function fetchEntries(): Promise<GuestEntry[] | null> {
    if (!token.value) return null

    try {
      const response = await $fetch<GuestEntriesResponse>('/api/admin/entries', {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })

      if (response.success && response.data) {
        return response.data
      }
      return null
    } catch {
      // Token might be expired
      logout()
      return null
    }
  }

  /**
   * Deletes an entry with admin authentication.
   *
   * @param id - The entry ID to delete.
   * @returns True if deletion succeeded.
   */
  async function deleteEntry(id: string): Promise<boolean> {
    if (!token.value) return false

    try {
      await $fetch(`/api/admin/entries/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })
      return true
    } catch {
      return false
    }
  }

  /**
   * Updates the moderation status of an entry.
   *
   * @param id - The entry ID.
   * @param status - The new status.
   * @param rejectionReason - Optional reason for rejection.
   * @returns The updated entry or null on failure.
   */
  async function updateEntryStatus(
    id: string,
    status: EntryStatus,
    rejectionReason?: string
  ): Promise<GuestEntry | null> {
    if (!token.value) return null

    try {
      const response = await $fetch<{ success: boolean; data?: GuestEntry }>(
        `/api/admin/entries/${id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token.value}`
          },
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
    if (!token.value) return -1

    try {
      const response = await $fetch<{ success: boolean; data?: { updated: number } }>(
        '/api/admin/entries/bulk',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.value}`
          },
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
    token: readonly(token),
    isAuthenticated: readonly(isAuthenticated),
    initAuth,
    login,
    logout,
    fetchEntries,
    deleteEntry,
    updateEntryStatus,
    bulkUpdateStatus
  }
}
