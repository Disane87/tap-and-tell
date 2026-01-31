import type { Tenant, CreateTenantInput, UpdateTenantInput } from '~/types/tenant'

/**
 * Module-level state for tenant management.
 * Shared across all components via module-level refs.
 */
const tenants = ref<Tenant[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

/**
 * Composable for tenant CRUD operations.
 *
 * Provides reactive state and methods for managing tenants.
 * State is shared across all components via module-level refs.
 *
 * @returns Reactive tenants array and CRUD methods.
 */
export function useTenants() {
  /**
   * Fetches all tenants owned by the current user.
   */
  async function fetchTenants(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; data?: Tenant[] }>('/api/tenants')
      if (response.success && response.data) {
        tenants.value = response.data
      } else {
        error.value = 'Failed to fetch tenants'
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch tenants'
    } finally {
      loading.value = false
    }
  }

  /**
   * Creates a new tenant.
   *
   * @param input - Tenant creation data.
   * @returns The created tenant or null on failure.
   */
  async function createTenant(input: CreateTenantInput): Promise<Tenant | null> {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; data?: Tenant }>('/api/tenants', {
        method: 'POST',
        body: input
      })
      if (response.success && response.data) {
        tenants.value.push(response.data)
        return response.data
      }
      error.value = 'Failed to create tenant'
      return null
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create tenant'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Updates an existing tenant.
   *
   * @param id - Tenant ID.
   * @param input - Update data.
   * @returns The updated tenant or null on failure.
   */
  async function updateTenant(id: string, input: UpdateTenantInput): Promise<Tenant | null> {
    try {
      const response = await $fetch<{ success: boolean; data?: Tenant }>(`/api/tenants/${id}`, {
        method: 'PUT',
        body: input
      })
      if (response.success && response.data) {
        const index = tenants.value.findIndex(t => t.id === id)
        if (index !== -1) {
          tenants.value[index] = response.data
        }
        return response.data
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Deletes a tenant.
   *
   * @param id - Tenant ID to delete.
   * @returns True if deleted successfully.
   */
  async function deleteTenant(id: string): Promise<boolean> {
    try {
      await $fetch(`/api/tenants/${id}`, { method: 'DELETE' })
      tenants.value = tenants.value.filter(t => t.id !== id)
      return true
    } catch {
      return false
    }
  }

  return {
    tenants: readonly(tenants),
    loading: readonly(loading),
    error: readonly(error),
    fetchTenants,
    createTenant,
    updateTenant,
    deleteTenant
  }
}
