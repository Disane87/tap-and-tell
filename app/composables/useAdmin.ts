/**
 * Composable for admin authentication using HMAC-SHA256 tokens.
 *
 * Tokens are stored in `sessionStorage` under the key `admin-token`.
 * Uses module-level `ref()` to avoid SSR hydration mismatches.
 *
 * @returns Reactive auth state and login/logout/check methods.
 */

const isAuthenticated = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)

const TOKEN_KEY = 'admin-token'

export function useAdmin() {
  /**
   * Authenticates with the admin password.
   * @param password - The admin password.
   * @returns `true` if login succeeded.
   */
  async function login(password: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; token?: string; error?: string }>(
        '/api/admin/login',
        { method: 'POST', body: { password } }
      )

      if (response.success && response.token) {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(TOKEN_KEY, response.token)
        }
        isAuthenticated.value = true
        return true
      } else {
        error.value = response.error || 'Login failed'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /** Clears the stored admin token and resets auth state. */
  function logout(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(TOKEN_KEY)
    }
    isAuthenticated.value = false
  }

  /** Checks whether a valid token exists in sessionStorage. */
  function checkAuth(): void {
    if (typeof sessionStorage !== 'undefined') {
      const token = sessionStorage.getItem(TOKEN_KEY)
      isAuthenticated.value = !!token
    }
  }

  /**
   * Retrieves the stored Bearer token for authenticated API calls.
   * @returns The token string, or `null` if not authenticated.
   */
  function getToken(): string | null {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(TOKEN_KEY)
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
