import type { TenantMemberWithUser } from '~/types/tenant'

/**
 * Composable for managing tenant members (invite, remove, list).
 *
 * Provides methods for owner-level member management operations.
 * State is scoped to the composable instance (not module-level)
 * since members are tenant-specific.
 *
 * @param tenantId - Reactive tenant ID reference.
 * @returns Reactive members array and management methods.
 */
export function useTenantMembers(tenantId: Ref<string> | ComputedRef<string>) {
  const members = ref<TenantMemberWithUser[]>([])
  const loading = ref(false)

  /**
   * Fetches all members of the tenant.
   */
  async function fetchMembers(): Promise<void> {
    loading.value = true
    try {
      const response = await $fetch<{ success: boolean; data?: TenantMemberWithUser[] }>(
        `/api/tenants/${tenantId.value}/members`
      )
      if (response.success && response.data) {
        members.value = response.data
      }
    } catch {
      members.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Invites a user to the tenant by email.
   *
   * @param email - The email address to invite.
   * @returns The invite token if successful, or null on failure.
   */
  async function inviteMember(email: string): Promise<string | null> {
    try {
      const response = await $fetch<{ success: boolean; data?: { token: string } }>(
        `/api/tenants/${tenantId.value}/members/invite`,
        { method: 'POST', body: { email } }
      )
      if (response.success && response.data) {
        return response.data.token
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Removes a member from the tenant.
   *
   * @param userId - The user ID of the member to remove.
   * @returns True if the member was removed.
   */
  async function removeMember(userId: string): Promise<boolean> {
    try {
      await $fetch(`/api/tenants/${tenantId.value}/members/${userId}`, {
        method: 'DELETE'
      })
      members.value = members.value.filter(m => m.userId !== userId)
      return true
    } catch {
      return false
    }
  }

  return {
    members: readonly(members),
    loading: readonly(loading),
    fetchMembers,
    inviteMember,
    removeMember
  }
}
