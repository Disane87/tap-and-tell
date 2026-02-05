import type { AuthUser, LoginCredentials, LoginResult, RegisterData } from '~/types/auth'

/**
 * Module-level state for owner authentication.
 * Shared across all components via module-level refs.
 */
const user = ref<AuthUser | null>(null)
const loading = ref(false)
const initialized = ref(false)

/** 2FA intermediate state — set when login returns requires2fa. */
const twoFactorToken = ref<string | null>(null)
const twoFactorMethod = ref<'totp' | 'email' | null>(null)

/**
 * Composable for owner authentication (register, login, logout, fetchMe, 2FA).
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
   * Refreshes the current user data from the API.
   * Unlike fetchMe, this always fetches regardless of initialized state.
   */
  async function refreshUser(): Promise<void> {
    try {
      const response = await $fetch<{ success: boolean; data?: AuthUser }>('/api/auth/me')
      if (response.success && response.data) {
        user.value = response.data
      }
    } catch {
      // Keep existing user value on error
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
   * Returns a LoginResult indicating the next step in the flow.
   *
   * @param credentials - Login credentials.
   * @returns 'success' if logged in, '2fa' if verification needed, 'error' on failure.
   */
  async function login(credentials: LoginCredentials): Promise<LoginResult> {
    loading.value = true
    try {
      const response = await $fetch<{
        success: boolean
        data?: AuthUser
        requires2fa?: boolean
        twoFactorToken?: string
        twoFactorMethod?: 'totp' | 'email'
      }>('/api/auth/login', {
        method: 'POST',
        body: credentials
      })

      if (response.requires2fa && response.twoFactorToken) {
        twoFactorToken.value = response.twoFactorToken
        twoFactorMethod.value = response.twoFactorMethod ?? 'totp'
        return '2fa'
      }

      if (response.success && response.data) {
        user.value = response.data
        return 'success'
      }
      return 'error'
    } catch {
      return 'error'
    } finally {
      loading.value = false
    }
  }

  /**
   * Verifies a 2FA code during login.
   *
   * @param code - The 6-digit verification code.
   * @returns True if verification succeeded and user is now authenticated.
   */
  async function verify2fa(code: string): Promise<boolean> {
    if (!twoFactorToken.value) return false
    loading.value = true
    try {
      const response = await $fetch<{ success: boolean; data?: AuthUser }>('/api/auth/2fa/verify', {
        method: 'POST',
        body: {
          token: twoFactorToken.value,
          code
        }
      })
      if (response.success && response.data) {
        user.value = response.data
        twoFactorToken.value = null
        twoFactorMethod.value = null
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
   * Resends the email OTP code during 2FA login.
   *
   * @returns True if the code was resent.
   */
  async function resend2faCode(): Promise<boolean> {
    if (!twoFactorToken.value) return false
    try {
      const response = await $fetch<{ success: boolean }>('/api/auth/2fa/resend', {
        method: 'POST',
        body: { token: twoFactorToken.value }
      })
      return response.success
    } catch {
      return false
    }
  }

  /**
   * Clears the 2FA state, returning to the credentials phase.
   */
  function clear2fa(): void {
    twoFactorToken.value = null
    twoFactorMethod.value = null
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
    twoFactorToken: readonly(twoFactorToken),
    twoFactorMethod: readonly(twoFactorMethod),
    fetchMe,
    refreshUser,
    register,
    login,
    verify2fa,
    resend2faCode,
    clear2fa,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    uploadAvatar,
    deleteAvatar
  }
}
