import type { TenantMemberWithUser } from '~/types/tenant'

/** A pending invite as returned by the invites list endpoint. */
export interface PendingInvite {
  id: string
  email: string
  role: string
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  inviterName: string
  expiresAt: string
  acceptedAt: string | null
  createdAt: string
}

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
  const invites = ref<PendingInvite[]>([])
  const invitesLoading = ref(false)

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
   * Fetches all invitations for the tenant.
   */
  async function fetchInvites(): Promise<void> {
    invitesLoading.value = true
    try {
      const response = await $fetch<{ success: boolean; data?: PendingInvite[] }>(
        `/api/tenants/${tenantId.value}/members/invites`
      )
      if (response.success && response.data) {
        invites.value = response.data
      }
    } catch {
      invites.value = []
    } finally {
      invitesLoading.value = false
    }
  }

  /**
   * Invites a user to the tenant by email.
   *
   * @param email - The email address to invite.
   * @returns Object with token and userExists flag if successful, or null on failure.
   */
  async function inviteMember(email: string): Promise<{ token: string; userExists: boolean } | null> {
    try {
      const response = await $fetch<{ success: boolean; data?: { token: string }; userExists?: boolean }>(
        `/api/tenants/${tenantId.value}/members/invite`,
        { method: 'POST', body: { email } }
      )
      if (response.success && response.data) {
        return { token: response.data.token, userExists: response.userExists ?? true }
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Cancels (revokes) a pending invitation.
   *
   * @param inviteId - The ID of the invite to cancel.
   * @returns True if the invite was cancelled.
   */
  async function cancelInvite(inviteId: string): Promise<boolean> {
    try {
      await $fetch(`/api/tenants/${tenantId.value}/members/invites/${inviteId}`, {
        method: 'DELETE'
      })
      invites.value = invites.value.filter(i => i.id !== inviteId)
      return true
    } catch {
      return false
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
    invites: readonly(invites),
    invitesLoading: readonly(invitesLoading),
    fetchMembers,
    fetchInvites,
    inviteMember,
    cancelInvite,
    removeMember
  }
}
