<script setup lang="ts">
/**
 * Main API Apps management section for the tenant admin page.
 * Self-contained — uses useApiApps composable internally.
 */
import { Key, Plus, Trash2, Pencil, ChevronDown } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { ApiTokenCreateResponse } from '~/types/api-app'

const props = defineProps<{
  tenantId: string
}>()

const { t } = useI18n()

const {
  apps, tokens, scopes, loading,
  fetchApps, createApp, updateApp, deleteApp,
  fetchTokens, createToken, revokeToken, fetchScopes
} = useApiApps(computed(() => props.tenantId))

const showSection = ref(false)
const expandedAppId = ref<string | null>(null)
const loadedAppTokens = ref<Set<string>>(new Set())

// Create app dialog
const showCreateDialog = ref(false)
const newAppName = ref('')
const newAppDescription = ref('')
const createLoading = ref(false)

// Edit app dialog
const showEditDialog = ref(false)
const editAppId = ref('')
const editAppName = ref('')
const editAppDescription = ref('')
const editLoading = ref(false)

// Create token dialog
const showCreateTokenDialog = ref(false)
const createTokenAppId = ref('')
const createTokenLoading = ref(false)

// Token reveal dialog
const showTokenReveal = ref(false)
const revealedToken = ref('')

onMounted(async () => {
  await Promise.all([fetchApps(), fetchScopes()])
})

/** Toggles app expansion and lazily loads tokens. */
async function toggleApp(appId: string): Promise<void> {
  if (expandedAppId.value === appId) {
    expandedAppId.value = null
    return
  }
  expandedAppId.value = appId
  if (!loadedAppTokens.value.has(appId)) {
    await fetchTokens(appId)
    loadedAppTokens.value.add(appId)
  }
}

/** Creates a new API app. */
async function handleCreateApp(): Promise<void> {
  if (!newAppName.value.trim()) return
  createLoading.value = true
  const app = await createApp(newAppName.value.trim(), newAppDescription.value.trim() || undefined)
  if (app) {
    toast.success(t('apiApps.createSuccess'))
    showCreateDialog.value = false
    newAppName.value = ''
    newAppDescription.value = ''
  } else {
    toast.error(t('apiApps.createFailed'))
  }
  createLoading.value = false
}

/** Opens the edit dialog for an app. */
function openEditDialog(appId: string, name: string, description: string | null): void {
  editAppId.value = appId
  editAppName.value = name
  editAppDescription.value = description ?? ''
  showEditDialog.value = true
}

/** Updates an existing API app. */
async function handleEditApp(): Promise<void> {
  if (!editAppName.value.trim()) return
  editLoading.value = true
  const success = await updateApp(editAppId.value, editAppName.value.trim(), editAppDescription.value.trim() || undefined)
  if (success) {
    toast.success(t('apiApps.editSuccess'))
    showEditDialog.value = false
  } else {
    toast.error(t('apiApps.editFailed'))
  }
  editLoading.value = false
}

/** Deletes an API app. */
async function handleDeleteApp(appId: string): Promise<void> {
  const success = await deleteApp(appId)
  if (success) {
    toast.success(t('apiApps.deleteSuccess'))
    if (expandedAppId.value === appId) expandedAppId.value = null
  } else {
    toast.error(t('apiApps.deleteFailed'))
  }
}

/** Opens the create token dialog for an app. */
function openCreateTokenDialog(appId: string): void {
  createTokenAppId.value = appId
  showCreateTokenDialog.value = true
}

/** Creates a new token and shows the reveal dialog. */
async function handleCreateToken(payload: { name: string; scopes: string[]; expiresInDays?: number }): Promise<void> {
  createTokenLoading.value = true
  const result = await createToken(createTokenAppId.value, payload)
  if (result) {
    toast.success(t('apiApps.createTokenSuccess'))
    showCreateTokenDialog.value = false
    revealedToken.value = result.token
    showTokenReveal.value = true
  } else {
    toast.error(t('apiApps.createTokenFailed'))
  }
  createTokenLoading.value = false
}

/** Revokes a token. */
async function handleRevokeToken(appId: string, tokenId: string): Promise<void> {
  const success = await revokeToken(appId, tokenId)
  if (success) {
    toast.success(t('apiApps.revokeSuccess'))
  } else {
    toast.error(t('apiApps.revokeFailed'))
  }
}
</script>

<template>
  <div>
    <!-- Section Header -->
    <div class="mb-4 flex items-center justify-between">
      <h2 class="flex items-center gap-2 text-xl font-semibold text-foreground">
        <Key class="h-5 w-5" />
        {{ $t('apiApps.title') }}
      </h2>
      <Button
        variant="outline"
        size="sm"
        @click="showSection = !showSection"
      >
        {{ showSection ? $t('common.cancel') : $t('apiApps.manage') }}
      </Button>
    </div>

    <div v-if="showSection" class="space-y-4">
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-8">
        <p class="animate-gentle-pulse text-muted-foreground">{{ $t('common.loading') }}</p>
      </div>

      <template v-else>
        <!-- Empty state -->
        <div v-if="apps.length === 0" class="py-8 text-center">
          <Key class="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p class="text-sm text-muted-foreground">{{ $t('apiApps.empty') }}</p>
          <Button class="mt-3" size="sm" @click="showCreateDialog = true">
            <Plus class="mr-1.5 h-3.5 w-3.5" />
            {{ $t('apiApps.create') }}
          </Button>
        </div>

        <!-- App list -->
        <template v-else>
          <div class="flex justify-end">
            <Button size="sm" @click="showCreateDialog = true">
              <Plus class="mr-1.5 h-3.5 w-3.5" />
              {{ $t('apiApps.create') }}
            </Button>
          </div>

          <div class="space-y-3">
            <Card
              v-for="app in apps"
              :key="app.id"
              class="overflow-hidden bg-card/70 backdrop-blur-xl border border-border/20 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
            >
              <CardContent class="p-0">
                <!-- App header (clickable to expand) -->
                <button
                  class="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/30"
                  @click="toggleApp(app.id)"
                >
                  <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Key class="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 class="font-medium text-foreground">{{ app.name }}</h3>
                      <p v-if="app.description" class="text-xs text-muted-foreground">{{ app.description }}</p>
                      <p class="text-xs text-muted-foreground">
                        {{ app.tokenCount }} {{ app.tokenCount === 1 ? 'token' : 'tokens' }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <!-- Edit button -->
                    <Button
                      variant="ghost"
                      size="icon"
                      class="text-muted-foreground hover:text-foreground"
                      @click.stop="openEditDialog(app.id, app.name, app.description)"
                    >
                      <Pencil class="h-4 w-4" />
                    </Button>
                    <!-- Delete button -->
                    <AlertDialog>
                      <AlertDialogTrigger as-child>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="text-muted-foreground hover:text-destructive"
                          @click.stop
                        >
                          <Trash2 class="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{{ $t('apiApps.deleteTitle') }}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {{ $t('apiApps.deleteConfirm') }}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{{ $t('common.cancel') }}</AlertDialogCancel>
                          <AlertDialogAction
                            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            @click="handleDeleteApp(app.id)"
                          >
                            {{ $t('common.delete') }}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <!-- Expand chevron -->
                    <ChevronDown
                      :class="['h-4 w-4 text-muted-foreground transition-transform duration-200', expandedAppId === app.id ? 'rotate-180' : '']"
                    />
                  </div>
                </button>

                <!-- Expanded token section -->
                <div v-if="expandedAppId === app.id" class="border-t border-border/20 p-4">
                  <AdminApiTokenList
                    :tokens="tokens[app.id] ?? []"
                    @create="openCreateTokenDialog(app.id)"
                    @revoke="handleRevokeToken(app.id, $event)"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </template>
      </template>
    </div>

    <!-- Create App Dialog -->
    <Dialog v-model:open="showCreateDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ $t('apiApps.createTitle') }}</DialogTitle>
          <DialogDescription>{{ $t('apiApps.createDescription') }}</DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="appName">{{ $t('apiApps.appName') }}</Label>
            <Input
              id="appName"
              v-model="newAppName"
              :placeholder="$t('apiApps.appNamePlaceholder')"
              @keyup.enter="handleCreateApp"
            />
          </div>
          <div class="space-y-2">
            <Label for="appDesc">{{ $t('apiApps.appDescription') }}</Label>
            <Input
              id="appDesc"
              v-model="newAppDescription"
              :placeholder="$t('apiApps.appDescriptionPlaceholder')"
            />
          </div>
        </div>
        <DialogFooter>
          <Button :disabled="!newAppName.trim() || createLoading" @click="handleCreateApp">
            {{ createLoading ? $t('common.saving') : $t('dashboard.createButton') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit App Dialog -->
    <Dialog v-model:open="showEditDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ $t('apiApps.editTitle') }}</DialogTitle>
          <DialogDescription class="sr-only">{{ $t('apiApps.editTitle') }}</DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="editAppName">{{ $t('apiApps.appName') }}</Label>
            <Input
              id="editAppName"
              v-model="editAppName"
              :placeholder="$t('apiApps.appNamePlaceholder')"
              @keyup.enter="handleEditApp"
            />
          </div>
          <div class="space-y-2">
            <Label for="editAppDesc">{{ $t('apiApps.appDescription') }}</Label>
            <Input
              id="editAppDesc"
              v-model="editAppDescription"
              :placeholder="$t('apiApps.appDescriptionPlaceholder')"
            />
          </div>
        </div>
        <DialogFooter>
          <Button :disabled="!editAppName.trim() || editLoading" @click="handleEditApp">
            {{ editLoading ? $t('common.saving') : $t('common.submit') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Create Token Dialog -->
    <AdminCreateTokenDialog
      :open="showCreateTokenDialog"
      :scopes="scopes"
      :loading="createTokenLoading"
      @update:open="showCreateTokenDialog = $event"
      @create="handleCreateToken"
    />

    <!-- Token Reveal Dialog -->
    <AdminTokenRevealDialog
      :open="showTokenReveal"
      :token="revealedToken"
      @close="showTokenReveal = false"
    />
  </div>
</template>
