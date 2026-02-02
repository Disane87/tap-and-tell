import type { AuthUser, LoginCredentials, RegisterData } from '~/types/auth'

/**
 * Module-level state for owner authentication.
 * Shared across all components via module-level refs.
 */
const user = ref<AuthUser | null>(null)
const loading = ref(false)
const initialized = ref(false)

/**
 * Composable for owner authentication (register, login, logout, fetchMe).
 *
 * Uses HTTP-only cookies for session management.
 * State is shared across all components via module-level refs.
 *
 * @returns Auth state and methods.
 */
export function useAuth() {
  /** Whether the user is authenticated. */
  const isAuthenticated = computed(() => !!user.value)

  /**
   * Fetches the current user from the API.
   * Called on app initialization to restore session.
   */
  async function fetchMe(): Promise<void> {
    if (initialized.value) return
    loading.value = true

    try {
      const response = await $fetch<{ success: boolean; data?: AuthUser }>('/api/auth/me')
      if (response.success && response.data) {
        user.value = response.data
      }
    } catch {
      user.value = null
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  /**
   * Registers a new owner account.
   *
   * @param data - Registration data (email, password, name).
   * @returns True if registration succeeded.
   */
  async function register(data: RegisterData): Promise<boolean> {
    loading.value = true
    try {
      const response = await $fetch<{ success: boolean; data?: AuthUser }>('/api/auth/register', {
        method: 'POST',
        body: data
      })
      if (response.success && response.data) {
        user.value = response.data
        return true
      }
      return false
    } catch {
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Logs in with email and password.
   *
   * @param credentials - Login credentials.
   * @returns True if login succeeded.
   */
  async function login(credentials: LoginCredentials): Promise<boolean> {
    loading.value = true
    try {
      const response = await $fetch<{ success: boolean; data?: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: credentials
      })
      if (response.success && response.data) {
        user.value = response.data
        return true
      }
      return false
    } catch {
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Logs out the current user.
   */
  async function logout(): Promise<void> {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore errors
    }
    user.value = null
  }

  /**
   * Updates the current user's profile (name and/or email).
   *
   * @param data - Fields to update.
   * @returns True if the update succeeded.
   */
  async function updateProfile(data: { name?: string; email?: string }): Promise<boolean> {
    try {
      const response = await $fetch<{ success: boolean; data?: AuthUser }>('/api/auth/me', {
        method: 'PUT',
        body: data
      })
      if (response.success && response.data) {
        user.value = response.data
        return true
      }
      return false
    } catch {
      return false
    }
  }

  /**
   * Changes the current user's password.
   *
   * @param data - Current and new password.
   * @returns True if the change succeeded.
   */
  async function changePassword(data: { currentPassword: string; newPassword: string }): Promise<boolean> {
    try {
      const response = await $fetch<{ success: boolean }>('/api/auth/password', {
        method: 'PUT',
        body: data
      })
      return response.success
    } catch {
      return false
    }
  }

  /**
   * Deletes the current user's account.
   *
   * @param password - Password confirmation.
   * @returns True if the deletion succeeded.
   */
  async function deleteAccount(password: string): Promise<boolean> {
    try {
      const response = await $fetch<{ success: boolean }>('/api/auth/me', {
        method: 'DELETE',
        body: { password }
      })
      if (response.success) {
        user.value = null
        return true
      }
      return false
    } catch {
      return false
    }
  }

  /**
   * Uploads a new avatar image for the current user.
   *
   * @param file - The image file to upload.
   * @returns True if the upload succeeded.
   */
  async function uploadAvatar(file: File): Promise<boolean> {
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const response = await $fetch<{ success: boolean; data?: { avatarUrl: string } }>('/api/auth/avatar', {
        method: 'POST',
        body: formData
      })
      if (response.success && response.data && user.value) {
        user.value = { ...user.value, avatarUrl: response.data.avatarUrl }
        return true
      }
      return false
    } catch {
      return false
    }
  }

  /**
   * Deletes the current user's avatar.
   *
   * @returns True if the deletion succeeded.
   */
  async function deleteAvatar(): Promise<boolean> {
    try {
      const response = await $fetch<{ success: boolean }>('/api/auth/avatar', {
        method: 'DELETE'
      })
      if (response.success && user.value) {
        user.value = { ...user.value, avatarUrl: null }
        return true
      }
      return false
    } catch {
      return false
    }
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    isAuthenticated,
    initialized: readonly(initialized),
    fetchMe,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    uploadAvatar,
    deleteAvatar
  }
}
