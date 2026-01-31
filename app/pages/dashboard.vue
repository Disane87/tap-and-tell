<script setup lang="ts">
/**
 * Dashboard redirect page.
 *
 * Each user has exactly one tenant (or is invited to one).
 * This page fetches the user's tenant and redirects to its admin page.
 * If no tenant exists yet, shows a create-tenant flow.
 */
import { Plus, BookOpen } from 'lucide-vue-next'

const { t } = useI18n()
const { user, logout } = useAuth()
const { tenants, loading, fetchTenants } = useTenants()

const showCreateDialog = ref(false)

onMounted(async () => {
  await fetchTenants()

  // Redirect to the user's tenant admin page
  if (tenants.value.length > 0) {
    await navigateTo(`/t/${tenants.value[0].id}/admin`, { replace: true })
  }
})

/**
 * Watches for tenant creation to redirect immediately.
 */
watch(tenants, (val) => {
  if (val.length > 0) {
    navigateTo(`/t/${val[0].id}/admin`, { replace: true })
  }
})
</script>

<template>
  <div class="mx-auto max-w-md px-4 py-20">
    <!-- Loading State -->
    <div v-if="loading" class="py-12 text-center text-muted-foreground">
      {{ t('common.loading') }}
    </div>

    <!-- No Tenant: Create Flow -->
    <div v-else-if="tenants.length === 0" class="text-center">
      <BookOpen class="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
      <h2 class="mb-2 text-lg font-medium text-foreground">{{ t('dashboard.noTenants') }}</h2>
      <p class="mb-6 text-sm text-muted-foreground">{{ t('dashboard.noTenantsHint') }}</p>
      <Button @click="showCreateDialog = true">
        <Plus class="mr-2 h-4 w-4" />
        {{ t('dashboard.createTenant') }}
      </Button>
    </div>

    <!-- Create Tenant Dialog -->
    <DashboardCreateTenantDialog
      :open="showCreateDialog"
      @close="showCreateDialog = false"
    />
  </div>
</template>
