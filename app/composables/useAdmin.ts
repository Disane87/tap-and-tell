/**
 * Composable for admin panel authentication.
 *
 * Manages login/logout via `POST /api/admin/login` with HMAC-SHA256 tokens
 * stored in `sessionStorage`. Provides reactive auth state and a `getToken()`
 * helper for attaching Bearer tokens to admin API requests.
 *
 * @returns Reactive auth state and login/logout/checkAuth/getToken functions.
 */
export function useAdmin() {
  const isAuthenticated = useState('admin-auth', () => false)
  const isLoading = useState('admin-loading', () => false)
  const error = useState<string | null>('admin-error', () => null)

  /**
   * Authenticates with the admin API using a password.
   * @param password - The admin password to verify.
   * @returns `true` if authentication succeeded.
   */
  async function login(password: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; token?: string; error?: string }>('/api/admin/login', {
        method: 'POST',
        body: { password }
      })

      if (response.success && response.token) {
        if (import.meta.client) {
          sessionStorage.setItem('admin-token', response.token)
        }
        isAuthenticated.value = true
        return true
      } else {
        error.value = response.error || 'Invalid password'
        return false
      }
    } catch (err) {
      error.value = 'Authentication failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /** Clears the admin session token and marks as unauthenticated. */
  function logout(): void {
    if (import.meta.client) {
      sessionStorage.removeItem('admin-token')
    }
    isAuthenticated.value = false
  }

  /** Checks whether a valid admin token exists in sessionStorage. */
  function checkAuth(): boolean {
    if (import.meta.client) {
      const token = sessionStorage.getItem('admin-token')
      isAuthenticated.value = !!token
      return !!token
    }
    return false
  }

  /** Returns the current admin Bearer token, or `null` if not authenticated. */
  function getToken(): string | null {
    if (import.meta.client) {
      return sessionStorage.getItem('admin-token')
    }
    return null
  }

  return {
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading),
    error: readonly(error),
    login,
    logout,
    checkAuth,
    getToken
  }
}
