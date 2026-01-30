<script setup lang="ts">
/**
 * Owner dashboard page showing all tenants (guestbooks)
 * with options to create, edit, and manage them.
 */
import { Plus, BookOpen, Settings, Trash2, Users } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const { t } = useI18n()
const { user, logout } = useAuth()
const { tenants, loading, fetchTenants, deleteTenant } = useTenants()

const showCreateDialog = ref(false)
const deleteConfirmId = ref<string | null>(null)

onMounted(() => {
  fetchTenants()
})

/**
 * Handles tenant deletion with confirmation.
 */
async function handleDelete(id: string) {
  const success = await deleteTenant(id)
  if (success) {
    toast.success(t('dashboard.deleteSuccess'))
  } else {
    toast.error(t('dashboard.deleteFailed'))
  }
  deleteConfirmId.value = null
}

/**
 * Handles user logout.
 */
async function handleLogout() {
  await logout()
  toast.success(t('common.logout'))
  navigateTo('/login')
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8">
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-foreground">{{ t('dashboard.title') }}</h1>
        <p class="text-sm text-muted-foreground">
          {{ t('dashboard.welcome', { name: user?.name }) }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" @click="handleLogout">
          {{ t('common.logout') }}
        </Button>
      </div>
    </div>

    <!-- Create Tenant Button -->
    <div class="mb-6">
      <Button @click="showCreateDialog = true">
        <Plus class="mr-2 h-4 w-4" />
        {{ t('dashboard.createTenant') }}
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="py-12 text-center text-muted-foreground">
      {{ t('common.loading') }}
    </div>

    <!-- Empty State -->
    <div v-else-if="tenants.length === 0" class="py-12 text-center">
      <BookOpen class="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
      <h2 class="mb-2 text-lg font-medium text-foreground">{{ t('dashboard.noTenants') }}</h2>
      <p class="text-sm text-muted-foreground">{{ t('dashboard.noTenantsHint') }}</p>
    </div>

    <!-- Tenant Grid -->
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="tenant in tenants"
        :key="tenant.id"
        class="transition-shadow hover:shadow-md"
      >
        <CardHeader class="pb-2">
          <CardTitle class="text-lg">{{ tenant.name }}</CardTitle>
          <CardDescription>
            <span class="flex items-center gap-1">
              <Users class="h-3.5 w-3.5" />
              {{ tenant.entryCount || 0 }} {{ t('common.entries') }}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex flex-wrap gap-2">
            <NuxtLink :to="`/t/${tenant.id}`">
              <Button variant="outline" size="sm">
                <BookOpen class="mr-1.5 h-3.5 w-3.5" />
                {{ t('dashboard.viewGuestbook') }}
              </Button>
            </NuxtLink>
            <NuxtLink :to="`/t/${tenant.id}/admin`">
              <Button variant="outline" size="sm">
                <Settings class="mr-1.5 h-3.5 w-3.5" />
                {{ t('dashboard.manage') }}
              </Button>
            </NuxtLink>
            <Button
              variant="ghost"
              size="sm"
              class="text-destructive hover:text-destructive"
              @click="deleteConfirmId = tenant.id"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Create Tenant Dialog -->
    <DashboardCreateTenantDialog
      :open="showCreateDialog"
      @close="showCreateDialog = false"
    />

    <!-- Delete Confirmation Dialog -->
    <AlertDialog :open="!!deleteConfirmId" @update:open="deleteConfirmId = null">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('dashboard.deleteTenant') }}</AlertDialogTitle>
          <AlertDialogDescription>{{ t('dashboard.deleteConfirm') }}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="deleteConfirmId && handleDelete(deleteConfirmId)"
          >
            {{ t('common.delete') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
