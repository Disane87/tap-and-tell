import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, readonly } from 'vue'
import type { Tenant } from '~/types/tenant'

/**
 * Mock $fetch for API calls
 */
const mockFetch = vi.fn()

/**
 * Unit tests for useTenants composable.
 * Tests tenant CRUD operations with module-level shared state.
 *
 * Uses dynamic imports with vi.resetModules() to ensure module-level
 * refs (tenants, loading, error) are freshly created for each test,
 * and that vi.stubGlobal calls run before the composable module is evaluated.
 */
describe('useTenants', () => {
  let useTenants: typeof import('../useTenants')['useTenants']

  const mockTenant: Tenant = {
    id: 'tenant-123',
    name: 'Test Tenant',
    ownerId: 'user-1',
    plan: 'free',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }

  const mockTenant2: Tenant = {
    id: 'tenant-456',
    name: 'Another Tenant',
    ownerId: 'user-1',
    plan: 'pro',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z'
  }

  beforeEach(async () => {
    vi.resetModules()
    mockFetch.mockReset()

    // Stub globals before importing the composable module
    vi.stubGlobal('$fetch', mockFetch)
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('readonly', readonly)

    const module = await import('../useTenants')
    useTenants = module.useTenants
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should return readonly tenants, loading, and error', () => {
      const { tenants, loading, error } = useTenants()
      expect(tenants.value).toBeDefined()
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
    })
  })

  describe('fetchTenants', () => {
    it('should fetch and store tenants on success', async () => {
      const mockTenants = [mockTenant, mockTenant2]
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: mockTenants
      })

      const { tenants, fetchTenants } = useTenants()
      await fetchTenants()

      expect(mockFetch).toHaveBeenCalledWith('/api/tenants')
      expect(tenants.value).toEqual(mockTenants)
    })

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: unknown) => void
      mockFetch.mockReturnValueOnce(
        new Promise(resolve => { resolvePromise = resolve })
      )

      const { loading, fetchTenants } = useTenants()

      const fetchPromise = fetchTenants()
      expect(loading.value).toBe(true)

      resolvePromise!({ success: true, data: [] })
      await fetchPromise

      expect(loading.value).toBe(false)
    })

    it('should clear error before fetching', async () => {
      // First cause an error
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      const { error, fetchTenants } = useTenants()
      await fetchTenants()
      expect(error.value).toBe('Network error')

      // Now fetch successfully
      mockFetch.mockResolvedValueOnce({ success: true, data: [] })
      await fetchTenants()
      expect(error.value).toBeNull()
    })

    it('should extract error message from FetchError data.message', async () => {
      mockFetch.mockRejectedValueOnce({
        data: { message: 'Unauthorized access' },
        statusCode: 401
      })

      const { error, fetchTenants } = useTenants()
      await fetchTenants()

      expect(error.value).toBe('Unauthorized access')
    })

    it('should fall back to error.message when data.message is absent', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

      const { error, fetchTenants } = useTenants()
      await fetchTenants()

      expect(error.value).toBe('Connection refused')
    })

    it('should fall back to default message when no error details available', async () => {
      mockFetch.mockRejectedValueOnce({})

      const { error, fetchTenants } = useTenants()
      await fetchTenants()

      expect(error.value).toBe('Failed to fetch tenants')
    })

    it('should set error when response success is false', async () => {
      mockFetch.mockResolvedValueOnce({
        success: false
      })

      const { error, fetchTenants } = useTenants()
      await fetchTenants()

      expect(error.value).toBe('Failed to fetch tenants')
    })

    it('should set error when response has success but no data', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true
        // data is missing
      })

      const { error, fetchTenants } = useTenants()
      await fetchTenants()

      expect(error.value).toBe('Failed to fetch tenants')
    })
  })

  describe('createTenant', () => {
    it('should create tenant and add to list on success', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: mockTenant
      })

      const { tenants, createTenant } = useTenants()
      const result = await createTenant({ name: 'Test Tenant' })

      expect(mockFetch).toHaveBeenCalledWith('/api/tenants', {
        method: 'POST',
        body: { name: 'Test Tenant' }
      })
      expect(result).toEqual(mockTenant)
      expect(tenants.value).toContainEqual(mockTenant)
    })

    it('should set loading state during creation', async () => {
      let resolvePromise: (value: unknown) => void
      mockFetch.mockReturnValueOnce(
        new Promise(resolve => { resolvePromise = resolve })
      )

      const { loading, createTenant } = useTenants()

      const createPromise = createTenant({ name: 'Test' })
      expect(loading.value).toBe(true)

      resolvePromise!({ success: true, data: mockTenant })
      await createPromise

      expect(loading.value).toBe(false)
    })

    it('should return null and set error on API failure', async () => {
      mockFetch.mockRejectedValueOnce({
        data: { message: 'Tenant limit reached' }
      })

      const { createTenant, error } = useTenants()
      const result = await createTenant({ name: 'Test' })

      expect(result).toBeNull()
      expect(error.value).toBe('Tenant limit reached')
    })

    it('should return null and set error on unsuccessful response', async () => {
      mockFetch.mockResolvedValueOnce({
        success: false
      })

      const { createTenant, error } = useTenants()
      const result = await createTenant({ name: 'Test' })

      expect(result).toBeNull()
      expect(error.value).toBe('Failed to create tenant')
    })

    it('should return null when response has success but no data', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true
        // data is missing
      })

      const { createTenant, error } = useTenants()
      const result = await createTenant({ name: 'Test' })

      expect(result).toBeNull()
      expect(error.value).toBe('Failed to create tenant')
    })

    it('should fall back to default error message for non-FetchError exceptions', async () => {
      mockFetch.mockRejectedValueOnce('string error')

      const { createTenant, error } = useTenants()
      const result = await createTenant({ name: 'Test' })

      expect(result).toBeNull()
      expect(error.value).toBe('Failed to create tenant')
    })
  })

  describe('updateTenant', () => {
    it('should update tenant and modify in list on success', async () => {
      const updatedTenant = { ...mockTenant, name: 'Updated Name' }

      // First fetch to populate list
      mockFetch.mockResolvedValueOnce({ success: true, data: [mockTenant] })
      const { tenants, fetchTenants, updateTenant } = useTenants()
      await fetchTenants()

      // Then update
      mockFetch.mockResolvedValueOnce({ success: true, data: updatedTenant })
      const result = await updateTenant('tenant-123', { name: 'Updated Name' })

      expect(mockFetch).toHaveBeenCalledWith('/api/tenants/tenant-123', {
        method: 'PUT',
        body: { name: 'Updated Name' }
      })
      expect(result).toEqual(updatedTenant)
      expect(tenants.value[0].name).toBe('Updated Name')
    })

    it('should return updated tenant but not modify list when tenant not found locally', async () => {
      const updatedTenant = { ...mockTenant, name: 'Updated Name' }
      mockFetch.mockResolvedValueOnce({ success: true, data: updatedTenant })

      const { tenants, updateTenant } = useTenants()
      // Don't fetch first, so list is empty or doesn't contain this tenant
      const result = await updateTenant('tenant-999', { name: 'Updated Name' })

      expect(result).toEqual(updatedTenant)
      // List should not contain tenant-999 since it wasn't there before
      expect(tenants.value.find(t => t.id === 'tenant-999')).toBeUndefined()
    })

    it('should return null on update failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Server error'))

      const { updateTenant } = useTenants()
      const result = await updateTenant('tenant-123', { name: 'Test' })

      expect(result).toBeNull()
    })

    it('should return null on unsuccessful response', async () => {
      mockFetch.mockResolvedValueOnce({ success: false })

      const { updateTenant } = useTenants()
      const result = await updateTenant('tenant-123', { name: 'Test' })

      expect(result).toBeNull()
    })

    it('should return null when response has success but no data', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true
        // data is missing
      })

      const { updateTenant } = useTenants()
      const result = await updateTenant('tenant-123', { name: 'Test' })

      expect(result).toBeNull()
    })
  })

  describe('deleteTenant', () => {
    it('should delete tenant and remove from list on success', async () => {
      // First fetch to populate list
      mockFetch.mockResolvedValueOnce({ success: true, data: [mockTenant, mockTenant2] })
      const { tenants, fetchTenants, deleteTenant } = useTenants()
      await fetchTenants()
      expect(tenants.value).toHaveLength(2)

      // Then delete
      mockFetch.mockResolvedValueOnce({})
      const result = await deleteTenant('tenant-123')

      expect(mockFetch).toHaveBeenCalledWith('/api/tenants/tenant-123', {
        method: 'DELETE'
      })
      expect(result).toBe(true)
      expect(tenants.value).toHaveLength(1)
      expect(tenants.value[0].id).toBe('tenant-456')
    })

    it('should return false on deletion failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Forbidden'))

      const { deleteTenant } = useTenants()
      const result = await deleteTenant('tenant-123')

      expect(result).toBe(false)
    })

    it('should not modify list when deletion fails', async () => {
      // First fetch to populate list
      mockFetch.mockResolvedValueOnce({ success: true, data: [mockTenant] })
      const { tenants, fetchTenants, deleteTenant } = useTenants()
      await fetchTenants()

      // Then fail to delete
      mockFetch.mockRejectedValueOnce(new Error('Server error'))
      await deleteTenant('tenant-123')

      expect(tenants.value).toHaveLength(1)
    })
  })

  describe('module-level state', () => {
    it('should share state across instances', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: [mockTenant]
      })

      const instance1 = useTenants()
      await instance1.fetchTenants()

      const instance2 = useTenants()
      expect(instance2.tenants.value).toEqual([mockTenant])
    })
  })
})
