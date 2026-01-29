export function useAdmin() {
  const isAuthenticated = useState('admin-auth', () => false)
  const isLoading = useState('admin-loading', () => false)
  const error = useState<string | null>('admin-error', () => null)

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

  function logout(): void {
    if (import.meta.client) {
      sessionStorage.removeItem('admin-token')
    }
    isAuthenticated.value = false
  }

  function checkAuth(): boolean {
    if (import.meta.client) {
      const token = sessionStorage.getItem('admin-token')
      isAuthenticated.value = !!token
      return !!token
    }
    return false
  }

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
