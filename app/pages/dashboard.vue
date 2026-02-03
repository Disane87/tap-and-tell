<script setup lang="ts">
/**
 * Dashboard page showing tenant admin (guestbook list, members, API apps).
 * If no tenant exists, shows a create-tenant flow.
 */
import { Trash2, Plus, Users, UserPlus, Shield, Copy, BookOpen, Calendar, Home, Eye } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { TenantRole } from '~/types/tenant'
import type { Guestbook, CreateGuestbookInput } from '~/types/guestbook'

const { t } = useI18n()
const router = useRouter()
const { user, isAuthenticated } = useAuth()
const { tenants, loading: tenantsLoading, fetchTenants } = useTenants()

// Current tenant (first one the user has access to)
const currentTenant = computed(() => tenants.value[0] ?? null)
const tenantId = computed(() => currentTenant.value?.id ?? '')

// Guestbooks for current tenant
const { guestbooks, loading: guestbooksLoading, fetchGuestbooks, createGuestbook, deleteGuestbook } = useGuestbooks(tenantId)
const { members, fetchMembers, inviteMember, removeMember } = useTenantMembers(tenantId)

const loading = computed(() => tenantsLoading.value || (currentTenant.value && guestbooksLoading.value))

const userRole = ref<TenantRole | null>(null)
const isOwner = computed(() => userRole.value === 'owner')
const showMembersSection = ref(false)
const showCreateDialog = ref(false)
const showCreateTenantDialog = ref(false)
const inviteEmail = ref('')
const inviteLoading = ref(false)
const lastInviteLink = ref<string | null>(null)

const newGuestbookName = ref('')
const newGuestbookType = ref<'permanent' | 'event'>('permanent')
const createLoading = ref(false)

/**
 * Handles creating a new guestbook.
 */
async function handleCreateGuestbook(): Promise<void> {
  if (!newGuestbookName.value.trim()) return
  createLoading.value = true

  const input: CreateGuestbookInput = {
    name: newGuestbookName.value.trim(),
    type: newGuestbookType.value
  }

  const gb = await createGuestbook(input)
  if (gb) {
    toast.success(t('guestbookAdmin.createSuccess'))
    showCreateDialog.value = false
    newGuestbookName.value = ''
    newGuestbookType.value = 'permanent'
  } else {
    toast.error(t('guestbookAdmin.createFailed'))
  }
  createLoading.value = false
}

/**
 * Handles deleting a guestbook.
 */
async function handleDeleteGuestbook(id: string): Promise<void> {
  const success = await deleteGuestbook(id)
  if (success) {
    toast.success(t('guestbookAdmin.deleteSuccess'))
  } else {
    toast.error(t('guestbookAdmin.deleteFailed'))
  }
}

/**
 * Handles inviting a co-owner by email.
 */
async function handleInvite(): Promise<void> {
  if (!inviteEmail.value) return
  inviteLoading.value = true
  const token = await inviteMember(inviteEmail.value)
  if (token) {
    const baseUrl = window.location.origin
    lastInviteLink.value = `${baseUrl}/accept-invite?token=${token}`
    inviteEmail.value = ''
    toast.success(t('members.inviteSuccess'))
  } else {
    toast.error(t('members.inviteFailed'))
  }
  inviteLoading.value = false
}

/**
 * Copies the invite link to the clipboard.
 */
async function copyInviteLink(): Promise<void> {
  if (!lastInviteLink.value) return
  try {
    await navigator.clipboard.writeText(lastInviteLink.value)
    toast.success(t('members.linkCopied'))
  } catch {
    toast.error(t('members.copyFailed'))
  }
}

/**
 * Handles removing a member from the tenant.
 */
async function handleRemoveMember(userId: string): Promise<void> {
  const success = await removeMember(userId)
  if (success) {
    toast.success(t('members.removeSuccess'))
  } else {
    toast.error(t('members.removeFailed'))
  }
}

/**
 * Loads tenant data including role and guestbooks.
 */
async function loadTenantData(): Promise<void> {
  if (!currentTenant.value) return

  try {
    const response = await $fetch<{ success: boolean; data?: { role?: TenantRole } }>(
      `/api/tenants/${tenantId.value}`
    )
    if (response.data?.role) {
      userRole.value = response.data.role
    }
  } catch {
    // Ignore role fetch errors
  }

  await fetchGuestbooks()

  if (isOwner.value) {
    await fetchMembers()
  }
}

// Watch for tenant changes and load data
watch(currentTenant, async (tenant) => {
  if (tenant) {
    await loadTenantData()
  }
}, { immediate: false })

onMounted(async () => {
  if (!isAuthenticated.value) {
    router.push('/login')
    return
  }

  await fetchTenants()

  if (currentTenant.value) {
    await loadTenantData()
  }
})
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8">
    <!-- Loading State -->
    <div v-if="loading" class="py-12 text-center text-muted-foreground">
      {{ t('common.loading') }}
    </div>

    <!-- No Tenant: Create Flow -->
    <div v-else-if="!currentTenant" class="mx-auto max-w-md py-12 text-center">
      <BookOpen class="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
      <h2 class="mb-2 text-lg font-medium text-foreground">{{ t('dashboard.noTenants') }}</h2>
      <p class="mb-6 text-sm text-muted-foreground">{{ t('dashboard.noTenantsHint') }}</p>
      <Button @click="showCreateTenantDialog = true">
        <Plus class="mr-2 h-4 w-4" />
        {{ t('dashboard.createTenant') }}
      </Button>

      <!-- Create Tenant Dialog -->
      <DashboardCreateTenantDialog
        :open="showCreateTenantDialog"
        @close="showCreateTenantDialog = false"
      />
    </div>

    <!-- Tenant Admin Content -->
    <template v-else>
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="font-display text-2xl font-semibold text-foreground">
            {{ currentTenant.name || t('dashboard.title') }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ guestbooks.length }} {{ guestbooks.length === 1 ? t('guestbookAdmin.guestbook') : t('guestbookAdmin.guestbooks') }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <Button v-if="isOwner" @click="showCreateDialog = true">
            <Plus class="mr-2 h-4 w-4" />
            {{ t('guestbookAdmin.create') }}
          </Button>
        </div>
      </div>

      <!-- Loading Guestbooks Skeleton -->
      <div v-if="guestbooksLoading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card v-for="i in 3" :key="i">
          <CardContent class="p-4">
            <div class="flex items-start gap-3">
              <Skeleton class="h-10 w-10 rounded-lg" />
              <div class="flex-1 space-y-2">
                <Skeleton class="h-4 w-32" />
                <Skeleton class="h-3 w-24" />
              </div>
            </div>
            <div class="mt-4 flex gap-2">
              <Skeleton class="h-8 flex-1 rounded-md" />
              <Skeleton class="h-8 w-8 rounded-md" />
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Empty guestbooks -->
      <EmptyState
        v-else-if="guestbooks.length === 0"
        :title="t('guestbookAdmin.empty')"
      >
        <template #icon>
          <BookOpen class="h-8 w-8 text-muted-foreground" />
        </template>
        <template #action>
          <Button v-if="isOwner" @click="showCreateDialog = true">
            <Plus class="mr-2 h-4 w-4" />
            {{ t('guestbookAdmin.create') }}
          </Button>
        </template>
      </EmptyState>

      <!-- Guestbook list -->
      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card v-for="gb in guestbooks" :key="gb.id" class="group">
          <CardContent class="p-4">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Home v-if="gb.type === 'permanent'" class="h-5 w-5 text-primary" />
                  <Calendar v-else class="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 class="font-medium text-foreground">{{ gb.name }}</h3>
                  <p class="text-xs text-muted-foreground">
                    {{ gb.entryCount || 0 }} {{ (gb.entryCount || 0) === 1 ? t('common.entry') : t('common.entries') }}
                    · {{ t(`guestbookAdmin.type${gb.type === 'permanent' ? 'Permanent' : 'Event'}`) }}
                  </p>
                </div>
              </div>

              <div v-if="isOwner" class="opacity-0 group-hover:opacity-100 transition-opacity">
                <AlertDialog>
                  <AlertDialogTrigger as-child>
                    <Button variant="ghost" size="icon" class="text-muted-foreground hover:text-destructive">
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{{ t('guestbookAdmin.deleteTitle') }}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {{ t('guestbookAdmin.deleteConfirm') }}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
                      <AlertDialogAction
                        class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        @click="handleDeleteGuestbook(gb.id)"
                      >
                        {{ t('common.delete') }}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div class="mt-4 flex gap-2">
              <NuxtLink :to="`/g/${gb.id}/admin`" class="flex-1">
                <Button variant="outline" size="sm" class="w-full">
                  {{ t('dashboard.manage') }}
                </Button>
              </NuxtLink>
              <NuxtLink :to="`/g/${gb.id}`" target="_blank">
                <Button variant="outline" size="icon-sm" class="h-8 w-8">
                  <Eye class="h-4 w-4" />
                </Button>
              </NuxtLink>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Create Guestbook Dialog -->
      <Dialog v-model:open="showCreateDialog">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{{ t('guestbookAdmin.createTitle') }}</DialogTitle>
            <DialogDescription>{{ t('guestbookAdmin.createDescription') }}</DialogDescription>
          </DialogHeader>
          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <Label for="gbName">{{ t('guestbookAdmin.name') }}</Label>
              <Input
                id="gbName"
                v-model="newGuestbookName"
                :placeholder="t('guestbookAdmin.namePlaceholder')"
                @keyup.enter="handleCreateGuestbook"
              />
            </div>
            <div class="space-y-2">
              <Label>{{ t('guestbookAdmin.type') }}</Label>
              <div class="flex gap-2">
                <Button
                  :variant="newGuestbookType === 'permanent' ? 'default' : 'outline'"
                  size="sm"
                  @click="newGuestbookType = 'permanent'"
                >
                  <Home class="mr-1.5 h-3.5 w-3.5" />
                  {{ t('guestbookAdmin.typePermanent') }}
                </Button>
                <Button
                  :variant="newGuestbookType === 'event' ? 'default' : 'outline'"
                  size="sm"
                  @click="newGuestbookType = 'event'"
                >
                  <Calendar class="mr-1.5 h-3.5 w-3.5" />
                  {{ t('guestbookAdmin.typeEvent') }}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button :disabled="!newGuestbookName.trim() || createLoading" @click="handleCreateGuestbook">
              {{ createLoading ? t('common.saving') : t('dashboard.createButton') }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- Members Section (Owner only) -->
      <div v-if="isOwner" class="mt-12">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="flex items-center gap-2 text-xl font-semibold text-foreground">
            <Users class="h-5 w-5" />
            {{ t('members.title') }}
          </h2>
          <Button
            variant="outline"
            size="sm"
            @click="showMembersSection = !showMembersSection"
          >
            {{ showMembersSection ? t('common.cancel') : t('members.manage') }}
          </Button>
        </div>

        <div v-if="showMembersSection" class="space-y-4">
          <!-- Invite Form -->
          <Card>
            <CardContent class="p-4">
              <h3 class="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                <UserPlus class="h-4 w-4" />
                {{ t('members.inviteTitle') }}
              </h3>
              <div class="flex gap-2">
                <Input
                  v-model="inviteEmail"
                  type="email"
                  :placeholder="t('members.emailPlaceholder')"
                  class="flex-1"
                  @keyup.enter="handleInvite"
                />
                <Button
                  :disabled="!inviteEmail || inviteLoading"
                  @click="handleInvite"
                >
                  {{ inviteLoading ? t('common.saving') : t('members.invite') }}
                </Button>
              </div>
              <!-- Invite Link -->
              <div v-if="lastInviteLink" class="mt-3 rounded-md bg-muted p-3">
                <p class="mb-1 text-xs text-muted-foreground">{{ t('members.inviteLinkHint') }}</p>
                <div class="flex items-center gap-2">
                  <code class="flex-1 truncate text-xs">{{ lastInviteLink }}</code>
                  <Button variant="ghost" size="icon" @click="copyInviteLink">
                    <Copy class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Members List -->
          <Card v-for="member in members" :key="member.id">
            <CardContent class="flex items-center justify-between p-4">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <span class="text-sm font-medium text-muted-foreground">
                    {{ member.user.name.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div>
                  <p class="text-sm font-medium text-foreground">{{ member.user.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ member.user.email }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="member.role === 'owner'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'"
                >
                  <Shield class="h-3 w-3" />
                  {{ t(`members.roles.${member.role}`) }}
                </span>
                <Button
                  v-if="member.role !== 'owner'"
                  variant="ghost"
                  size="icon"
                  class="text-muted-foreground hover:text-destructive"
                  @click="handleRemoveMember(member.userId)"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- API Apps Section (Owner only) -->
      <AdminApiApps v-if="isOwner" :tenant-id="tenantId" class="mt-12" />
    </template>
  </div>
</template>
