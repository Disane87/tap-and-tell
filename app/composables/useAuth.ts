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

  return {
    user: readonly(user),
    loading: readonly(loading),
    isAuthenticated,
    initialized: readonly(initialized),
    fetchMe,
    register,
    login,
    logout
  }
}
