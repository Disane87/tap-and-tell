import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, computed, readonly } from 'vue'
import type { ApiApp, ApiToken, ApiTokenCreateResponse, ApiScopeDefinition } from '~/types/api-app'

/**
 * Mock $fetch for API calls
 */
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

/**
 * Mock Vue auto-imports for Nuxt
 */
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('readonly', readonly)

// Import after mocks
import { useApiApps } from '../useApiApps'

/**
 * Unit tests for useApiApps composable.
 * Tests API app and token management operations.
 * State is instance-scoped (not module-level).
 */
describe('useApiApps', () => {
  const mockApp: ApiApp = {
    id: 'app-1',
    name: 'Test App',
    description: 'A test application',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    tokenCount: 2
  }

  const mockApp2: ApiApp = {
    id: 'app-2',
    name: 'Another App',
    description: null,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    tokenCount: 0
  }

  const mockToken: ApiToken = {
    id: 'token-1',
    name: 'Read Token',
    tokenPrefix: 'tt_abc',
    scopes: ['entries:read'],
    expiresAt: '2025-01-01T00:00:00Z',
    lastUsedAt: null,
    revokedAt: null,
    createdAt: '2024-01-01T00:00:00Z'
  }

  const mockToken2: ApiToken = {
    id: 'token-2',
    name: 'Write Token',
    tokenPrefix: 'tt_def',
    scopes: ['entries:read', 'entries:write'],
    expiresAt: null,
    lastUsedAt: '2024-06-15T00:00:00Z',
    revokedAt: null,
    createdAt: '2024-03-01T00:00:00Z'
  }

  const mockTokenCreateResponse: ApiTokenCreateResponse = {
    id: 'token-3',
    name: 'New Token',
    token: 'tt_plaintext_secret_value',
    prefix: 'tt_pla',
    scopes: ['entries:read'],
    expiresAt: '2025-06-01T00:00:00Z'
  }

  const mockScopes: ApiScopeDefinition[] = [
    { scope: 'entries:read', description: 'Read guestbook entries' },
    { scope: 'entries:write', description: 'Create guestbook entries' },
    { scope: 'guestbooks:read', description: 'Read guestbook settings' }
  ]

  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should accept a computed tenant ID', () => {
      const tenantId = computed(() => 'tenant-123')
      const { apps, tokens, scopes, loading } = useApiApps(tenantId)
      expect(apps.value).toEqual([])
      expect(tokens.value).toEqual({})
      expect(scopes.value).toEqual([])
      expect(loading.value).toBe(false)
    })

    it('should accept a ref tenant ID', () => {
      const tenantId = ref('tenant-123')
      const { apps, loading } = useApiApps(tenantId)
      expect(apps.value).toEqual([])
      expect(loading.value).toBe(false)
    })
  })

  describe('fetchApps', () => {
    it('should fetch and store apps on success', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: [mockApp, mockApp2]
      })

      const tenantId = computed(() => 'tenant-123')
      const { apps, fetchApps } = useApiApps(tenantId)
      const result = await fetchApps()

      expect(mockFetch).toHaveBeenCalledWith('/api/tenants/tenant-123/apps')
      expect(result).toBe(true)
      expect(apps.value).toEqual([mockApp, mockApp2])
    })

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: unknown) => void
      mockFetch.mockReturnValueOnce(
        new Promise(resolve => { resolvePromise = resolve })
      )

      const tenantId = computed(() => 'tenant-123')
      const { loading, fetchApps } = useApiApps(tenantId)

      const fetchPromise = fetchApps()
      expect(loading.value).toBe(true)

      resolvePromise!({ success: true, data: [] })
      await fetchPromise

      expect(loading.value).toBe(false)
    })

    it('should clear apps and return false on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const tenantId = computed(() => 'tenant-123')
      const { apps, fetchApps } = useApiApps(tenantId)
      const result = await fetchApps()

      expect(result).toBe(false)
      expect(apps.value).toEqual([])
    })

    it('should reset loading after error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Error'))

      const tenantId = computed(() => 'tenant-123')
      const { loading, fetchApps } = useApiApps(tenantId)
      await fetchApps()

      expect(loading.value).toBe(false)
    })
  })

  describe('createApp', () => {
    it('should create app and add to list with tokenCount 0', async () => {
      const createdApp: ApiApp = {
        id: 'app-new',
        name: 'New App',
        description: 'Description',
        createdAt: '2024-06-01T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
        tokenCount: 0
      }

      mockFetch.mockResolvedValueOnce({
        success: true,
        data: createdApp
      })

      const tenantId = computed(() => 'tenant-123')
      const { apps, createApp } = useApiApps(tenantId)
      const result = await createApp('New App', 'Description')

      expect(mockFetch).toHaveBeenCalledWith('/api/tenants/tenant-123/apps', {
        method: 'POST',
        body: { name: 'New App', description: 'Description' }
      })
      expect(result).toEqual(createdApp)
      expect(apps.value).toHaveLength(1)
      expect(apps.value[0].tokenCount).toBe(0)
    })

    it('should add to existing apps list', async () => {
      // First populate
      mockFetch.mockResolvedValueOnce({ success: true, data: [mockApp] })
      const tenantId = computed(() => 'tenant-123')
      const { apps, fetchApps, createApp } = useApiApps(tenantId)
      await fetchApps()

      // Then create
      const newApp: ApiApp = { ...mockApp2, id: 'app-new' }
      mockFetch.mockResolvedValueOnce({ success: true, data: newApp })
      await createApp('Another App')

      expect(apps.value).toHaveLength(2)
    })

    it('should return null on create error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Server error'))

      const tenantId = computed(() => 'tenant-123')
      const { createApp } = useApiApps(tenantId)
      const result = await createApp('Test')

      expect(result).toBeNull()
    })

    it('should return null on unsuccessful response', async () => {
      mockFetch.mockResolvedValueOnce({ success: false })

      const tenantId = computed(() => 'tenant-123')
      const { createApp } = useApiApps(tenantId)
      const result = await createApp('Test')

      expect(result).toBeNull()
    })

    it('should handle optional description parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: { ...mockApp2, id: 'app-new' }
      })

      const tenantId = computed(() => 'tenant-123')
      const { createApp } = useApiApps(tenantId)
      await createApp('No Desc')

      expect(mockFetch).toHaveBeenCalledWith('/api/tenants/tenant-123/apps', {
        method: 'POST',
        body: { name: 'No Desc', description: undefined }
      })
    })
  })

  describe('updateApp', () => {
    it('should update app name and description in list', async () => {
      // Populate list first
      mockFetch.mockResolvedValueOnce({ success: true, data: [mockApp] })
      const tenantId = computed(() => 'tenant-123')
      const { apps, fetchApps, updateApp } = useApiApps(tenantId)
      await fetchApps()

      // Update
      mockFetch.mockResolvedValueOnce({})
      const result = await updateApp('app-1', 'Updated Name', 'Updated Desc')

      expect(mockFetch).toHaveBeenCalledWith('/api/tenants/tenant-123/apps/app-1', {
        method: 'PUT',
        body: { name: 'Updated Name', description: 'Updated Desc' }
      })
      expect(result).toBe(true)
      expect(apps.value[0].name).toBe('Updated Name')
      expect(apps.value[0].description).toBe('Updated Desc')
    })

    it('should preserve existing description when not provided', async () => {
      mockFetch.mockResolvedValueOnce({ success: true, data: [mockApp] })
      const tenantId = computed(() => 'tenant-123')
      const { apps, fetchApps, updateApp } = useApiApps(tenantId)
      await fetchApps()

      mockFetch.mockResolvedValueOnce({})
      await updateApp('app-1', 'New Name')

      expect(apps.value[0].name).toBe('New Name')
      expect(apps.value[0].description).toBe('A test application')
    })

    it('should not modify other apps in the list', async () => {
      mockFetch.mockResolvedValueOnce({ success: true, data: [mockApp, mockApp2] })
      const tenantId = computed(() => 'tenant-123')
      const { apps, fetchApps, updateApp } = useApiApps(tenantId)
      await fetchApps()

      mockFetch.mockResolvedValueOnce({})
      await updateApp('app-1', 'Updated')

      expect(apps.value[1]).toEqual(mockApp2)
    })

    it('should return false on update error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Not found'))

      const tenantId = computed(() => 'tenant-123')
      const { updateApp } = useApiApps(tenantId)
      const result = await updateApp('app-1', 'Test')

      expect(result).toBe(false)
    })
  })

  describe('deleteApp', () => {
    it('should remove app from list on success', async () => {
      mockFetch.mockResolvedValueOnce({ success: true, data: [mockApp, mockApp2] })
      const tenantId = computed(() => 'tenant-123')
      const { apps, fetchApps, deleteApp } = useApiApps(tenantId)
      await fetchApps()

      mockFetch.mockResolvedValueOnce({})
      const result = await deleteApp('app-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/tenants/tenant-123/apps/app-1', {
        method: 'DELETE'
      })
      expect(result).toBe(true)
      expect(apps.value).toHaveLength(1)
      expect(apps.value[0].id).toBe('app-2')
    })

    it('should also remove tokens for deleted app', async () => {
      // Setup: populate apps and tokens
      mockFetch.mockResolvedValueOnce({ success: true, data: [mockApp] })
      const tenantId = computed(() => 'tenant-123')
      const { apps, tokens, fetchApps, fetchTokens, deleteApp } = useApiApps(tenantId)
      await fetchApps()

      mockFetch.mockResolvedValueOnce({ success: true, data: [mockToken] })
      await fetchTokens('app-1')
      expect(tokens.value['app-1']).toHaveLength(1)

      // Delete app
      mockFetch.mockResolvedValueOnce({})
      await deleteApp('app-1')

      expect(apps.value).toHaveLength(0)
      expect(tokens.value['app-1']).toBeUndefined()
    })

    it('should return false on delete error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Forbidden'))

      const tenantId = computed(() => 'tenant-123')
      const { deleteApp } = useApiApps(tenantId)
      const result = await deleteApp('app-1')

      expect(result).toBe(false)
    })
  })

  describe('fetchTokens', () => {
    it('should fetch tokens for a specific app', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: [mockToken, mockToken2]
      })

      const tenantId = computed(() => 'tenant-123')
      const { tokens, fetchTokens } = useApiApps(tenantId)
      const result = await fetchTokens('app-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/tenants/tenant-123/apps/app-1/tokens')
      expect(result).toBe(true)
      expect(tokens.value['app-1']).toEqual([mockToken, mockToken2])
    })

    it('should store tokens separately per app', async () => {
      mockFetch.mockResolvedValueOnce({ success: true, data: [mockToken] })
      const tenantId = computed(() => 'tenant-123')
      const { tokens, fetchTokens } = useApiApps(tenantId)
      await fetchTokens('app-1')

      mockFetch.mockResolvedValueOnce({ success: true, data: [mockToken2] })
      await fetchTokens('app-2')

      expect(tokens.value['app-1']).toEqual([mockToken])
      expect(tokens.value['app-2']).toEqual([mockToken2])
    })

    it('should return false on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Error'))

      const tenantId = computed(() => 'tenant-123')
      const { fetchTokens } = useApiApps(tenantId)
      const result = await fetchTokens('app-1')

      expect(result).toBe(false)
    })
  })

  describe('createToken', () => {
    it('should create token and add to local list', async () => {
      // Setup: populate app
      mockFetch.mockResolvedValueOnce({ success: true, data: [mockApp] })
      const tenantId = computed(() => 'tenant-123')
      const { apps, tokens, fetchApps, createToken } = useApiApps(tenantId)
      await fetchApps()

      // Create token
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: mockTokenCreateResponse
      })
      const result = await createToken('app-1', {
        name: 'New Token',
        scopes: ['entries:read'],
        expiresInDays: 90
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/tenants/tenant-123/apps/app-1/tokens', {
        method: 'POST',
        body: { name: 'New Token', scopes: ['entries:read'], expiresInDays: 90 }
      })
      expect(result).toEqual(mockTokenCreateResponse)

      // Token should be added to local list
      expect(tokens.value['app-1']).toHaveLength(1)
      expect(tokens.value['app-1'][0].id).toBe('token-3')
      expect(tokens.value['app-1'][0].name).toBe('New Token')
      expect(tokens.value['app-1'][0].tokenPrefix).toBe('tt_pla')
      expect(tokens.value['app-1'][0].scopes).toEqual(['entries:read'])
      expect(tokens.value['app-1'][0].revokedAt).toBeNull()
    })

    it('should increment tokenCount on the app', async () => {
      mockFetch.mockResolvedValueOnce({ success: true, data: [mockApp] })
      const tenantId = computed(() => 'tenant-123')
      const { apps, fetchApps, createToken } = useApiApps(tenantId)
      await fetchApps()
      const originalCount = apps.value[0].tokenCount

      mockFetch.mockResolvedValueOnce({ success: true, data: mockTokenCreateResponse })
      await createToken('app-1', { name: 'Token', scopes: ['entries:read'] })

      expect(apps.value[0].tokenCount).toBe(originalCount + 1)
    })

    it('should append to existing tokens for the app', async () => {
      const tenantId = computed(() => 'tenant-123')
      const { tokens, fetchTokens, createToken } = useApiApps(tenantId)

      // Fetch existing tokens
      mockFetch.mockResolvedValueOnce({ success: true, data: [mockToken] })
      await fetchTokens('app-1')
      expect(tokens.value['app-1']).toHaveLength(1)

      // Create new token (need apps populated too for tokenCount)
      mockFetch.mockResolvedValueOnce({ success: true, data: mockTokenCreateResponse })
      await createToken('app-1', { name: 'Token', scopes: ['entries:read'] })

      expect(tokens.value['app-1']).toHaveLength(2)
    })

    it('should return null on create error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Forbidden'))

      const tenantId = computed(() => 'tenant-123')
      const { createToken } = useApiApps(tenantId)
      const result = await createToken('app-1', { name: 'Token', scopes: [] })

      expect(result).toBeNull()
    })

    it('should return null on unsuccessful response', async () => {
      mockFetch.mockResolvedValueOnce({ success: false })

      const tenantId = computed(() => 'tenant-123')
      const { createToken } = useApiApps(tenantId)
      const result = await createToken('app-1', { name: 'Token', scopes: [] })

      expect(result).toBeNull()
    })
  })

  describe('revokeToken', () => {
    it('should set revokedAt on the token in local state', async () => {
      // Setup: populate tokens
      mockFetch.mockResolvedValueOnce({ success: true, data: [mockToken, mockToken2] })
      const tenantId = computed(() => 'tenant-123')
      const { tokens, fetchTokens, revokeToken } = useApiApps(tenantId)
      await fetchTokens('app-1')

      // Revoke
      mockFetch.mockResolvedValueOnce({})
      const result = await revokeToken('app-1', 'token-1')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-123/apps/app-1/tokens/token-1',
        { method: 'DELETE' }
      )
      expect(result).toBe(true)
      expect(tokens.value['app-1'][0].revokedAt).not.toBeNull()
      // Other token should be unaffected
      expect(tokens.value['app-1'][1].revokedAt).toBeNull()
    })

    it('should decrement tokenCount on the app', async () => {
      // Setup: populate apps and tokens
      mockFetch.mockResolvedValueOnce({ success: true, data: [mockApp] })
      const tenantId = computed(() => 'tenant-123')
      const { apps, fetchApps, revokeToken } = useApiApps(tenantId)
      await fetchApps()
      const originalCount = apps.value[0].tokenCount

      mockFetch.mockResolvedValueOnce({})
      await revokeToken('app-1', 'token-1')

      expect(apps.value[0].tokenCount).toBe(originalCount - 1)
    })

    it('should not decrement tokenCount below 0', async () => {
      // Setup with tokenCount 0
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: [{ ...mockApp, tokenCount: 0 }]
      })
      const tenantId = computed(() => 'tenant-123')
      const { apps, fetchApps, revokeToken } = useApiApps(tenantId)
      await fetchApps()

      mockFetch.mockResolvedValueOnce({})
      await revokeToken('app-1', 'token-1')

      expect(apps.value[0].tokenCount).toBe(0)
    })

    it('should return false on revoke error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Not found'))

      const tenantId = computed(() => 'tenant-123')
      const { revokeToken } = useApiApps(tenantId)
      const result = await revokeToken('app-1', 'token-1')

      expect(result).toBe(false)
    })
  })

  describe('fetchScopes', () => {
    it('should fetch and store available scopes', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: mockScopes
      })

      const tenantId = computed(() => 'tenant-123')
      const { scopes, fetchScopes } = useApiApps(tenantId)
      const result = await fetchScopes()

      expect(mockFetch).toHaveBeenCalledWith('/api/scopes')
      expect(result).toBe(true)
      expect(scopes.value).toEqual(mockScopes)
    })

    it('should return false on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Error'))

      const tenantId = computed(() => 'tenant-123')
      const { fetchScopes } = useApiApps(tenantId)
      const result = await fetchScopes()

      expect(result).toBe(false)
    })
  })

  describe('instance-scoped state', () => {
    it('should have separate state per instance', async () => {
      mockFetch.mockResolvedValueOnce({ success: true, data: [mockApp] })
      const tenantId1 = computed(() => 'tenant-123')
      const instance1 = useApiApps(tenantId1)
      await instance1.fetchApps()

      const tenantId2 = computed(() => 'tenant-456')
      const instance2 = useApiApps(tenantId2)

      expect(instance1.apps.value).toHaveLength(1)
      expect(instance2.apps.value).toHaveLength(0)
    })
  })

  describe('reactive tenant ID', () => {
    it('should use updated tenant ID in API calls', async () => {
      const tenantId = ref('tenant-1')
      mockFetch.mockResolvedValue({ success: true, data: [] })

      const { fetchApps } = useApiApps(tenantId)

      await fetchApps()
      expect(mockFetch).toHaveBeenCalledWith('/api/tenants/tenant-1/apps')

      tenantId.value = 'tenant-2'
      await fetchApps()
      expect(mockFetch).toHaveBeenCalledWith('/api/tenants/tenant-2/apps')
    })
  })
})
