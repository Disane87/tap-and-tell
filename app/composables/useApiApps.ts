import type { ApiApp, ApiToken, ApiTokenCreateResponse, CreateApiTokenInput, ApiScopeDefinition } from '~/types/api-app'

/**
 * Composable for managing API apps and tokens for a tenant.
 *
 * State is scoped to the composable instance (not module-level)
 * since apps are tenant-specific.
 *
 * @param tenantId - Reactive tenant ID reference.
 * @returns Reactive state and management methods.
 */
export function useApiApps(tenantId: Ref<string> | ComputedRef<string>) {
  const apps = ref<ApiApp[]>([])
  const tokens = ref<Record<string, ApiToken[]>>({})
  const scopes = ref<ApiScopeDefinition[]>([])
  const loading = ref(false)

  /** Fetches all API apps for the tenant. */
  async function fetchApps(): Promise<boolean> {
    loading.value = true
    try {
      const response = await $fetch<{ success: boolean; data?: ApiApp[] }>(
        `/api/tenants/${tenantId.value}/apps`
      )
      if (response.success && response.data) {
        apps.value = response.data
      }
      return true
    } catch {
      apps.value = []
      return false
    } finally {
      loading.value = false
    }
  }

  /** Creates a new API app. */
  async function createApp(name: string, description?: string): Promise<ApiApp | null> {
    try {
      const response = await $fetch<{ success: boolean; data?: ApiApp }>(
        `/api/tenants/${tenantId.value}/apps`,
        { method: 'POST', body: { name, description } }
      )
      if (response.success && response.data) {
        apps.value = [...apps.value, { ...response.data, tokenCount: 0, createdAt: response.data.createdAt ?? new Date().toISOString(), updatedAt: response.data.updatedAt ?? new Date().toISOString() }]
        return response.data
      }
      return null
    } catch {
      return null
    }
  }

  /** Updates an existing API app. */
  async function updateApp(appId: string, name: string, description?: string): Promise<boolean> {
    try {
      await $fetch(`/api/tenants/${tenantId.value}/apps/${appId}`, {
        method: 'PUT',
        body: { name, description }
      })
      apps.value = apps.value.map(a =>
        a.id === appId ? { ...a, name, description: description ?? a.description, updatedAt: new Date().toISOString() } : a
      )
      return true
    } catch {
      return false
    }
  }

  /** Deletes an API app and removes its tokens from local state. */
  async function deleteApp(appId: string): Promise<boolean> {
    try {
      await $fetch(`/api/tenants/${tenantId.value}/apps/${appId}`, {
        method: 'DELETE'
      })
      apps.value = apps.value.filter(a => a.id !== appId)
      const newTokens = { ...tokens.value }
      delete newTokens[appId]
      tokens.value = newTokens
      return true
    } catch {
      return false
    }
  }

  /** Fetches tokens for a specific app. */
  async function fetchTokens(appId: string): Promise<boolean> {
    try {
      const response = await $fetch<{ success: boolean; data?: ApiToken[] }>(
        `/api/tenants/${tenantId.value}/apps/${appId}/tokens`
      )
      if (response.success && response.data) {
        tokens.value = { ...tokens.value, [appId]: response.data }
      }
      return true
    } catch {
      return false
    }
  }

  /** Creates a new token for an app. Returns the plaintext token response (shown once). */
  async function createToken(appId: string, input: CreateApiTokenInput): Promise<ApiTokenCreateResponse | null> {
    try {
      const response = await $fetch<{ success: boolean; data?: ApiTokenCreateResponse }>(
        `/api/tenants/${tenantId.value}/apps/${appId}/tokens`,
        { method: 'POST', body: input }
      )
      if (response.success && response.data) {
        // Add to local token list
        const newToken: ApiToken = {
          id: response.data.id,
          name: response.data.name,
          tokenPrefix: response.data.prefix,
          scopes: response.data.scopes,
          expiresAt: response.data.expiresAt,
          lastUsedAt: null,
          revokedAt: null,
          createdAt: new Date().toISOString()
        }
        const appTokens = tokens.value[appId] ?? []
        tokens.value = { ...tokens.value, [appId]: [...appTokens, newToken] }
        // Update token count on app
        apps.value = apps.value.map(a =>
          a.id === appId ? { ...a, tokenCount: a.tokenCount + 1 } : a
        )
        return response.data
      }
      return null
    } catch {
      return null
    }
  }

  /** Revokes a token (soft delete). Updates local state instead of re-fetching. */
  async function revokeToken(appId: string, tokenId: string): Promise<boolean> {
    try {
      await $fetch(`/api/tenants/${tenantId.value}/apps/${appId}/tokens/${tokenId}`, {
        method: 'DELETE'
      })
      const appTokens = tokens.value[appId] ?? []
      tokens.value = {
        ...tokens.value,
        [appId]: appTokens.map(t =>
          t.id === tokenId ? { ...t, revokedAt: new Date().toISOString() } : t
        )
      }
      // Decrease token count on app
      apps.value = apps.value.map(a =>
        a.id === appId ? { ...a, tokenCount: Math.max(0, a.tokenCount - 1) } : a
      )
      return true
    } catch {
      return false
    }
  }

  /** Fetches available API scopes. */
  async function fetchScopes(): Promise<boolean> {
    try {
      const response = await $fetch<{ success: boolean; data?: ApiScopeDefinition[] }>(
        '/api/scopes'
      )
      if (response.success && response.data) {
        scopes.value = response.data
      }
      return true
    } catch {
      return false
    }
  }

  return {
    apps: readonly(apps),
    tokens: readonly(tokens),
    scopes: readonly(scopes),
    loading: readonly(loading),
    fetchApps,
    createApp,
    updateApp,
    deleteApp,
    fetchTokens,
    createToken,
    revokeToken,
    fetchScopes
  }
}
